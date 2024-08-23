import express, { Request, Response } from "express";
import session from "express-session";

import path from "node:path";
import {
  buyVoucher,
  getBalance,
  initialize,
  redeemVoucher,
  seed,
} from "./utils/db";
import { toCurrency } from "./utils/format";
import { appSecret } from "./utils/security";
import { redisStore } from "./utils/session";

declare module "express-session" {
  interface SessionData {
    accountId: string;
  }
}

const app = express();
const port = process.env.PORT ?? 3000;

app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use(express.urlencoded());

app.use(
  session({
    store: redisStore,
    secret: appSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.get("/", async (req: Request, res: Response) => {
  req.session.accountId = "69";
  const { accountId } = req.session;
  const balance = await getBalance(accountId);

  return res.render("index", {
    page: "Home",
    code: "",
    error: "",
    balance: toCurrency(balance),
  });
});

app.post("/", async (req: Request, res: Response) => {
  const { accountId } = req.session;
  if (!accountId) {
    return res.redirect("/");
  }

  let balance = 0;
  let code = "";
  try {
    const { itemId } = req.body;
    const result = await buyVoucher(accountId, itemId);

    balance = result.balance;
    code = result.code;
  } catch (err: any) {
    console.error(err);
    return res.render("index", {
      page: "Home",
      code,
      balance: toCurrency(balance),
    });
  }

  return res.render("index", {
    page: "Home",
    code,
    balance: toCurrency(balance),
  });
});

app.post("/redeem", async (req: Request, res: Response) => {
  const { accountId } = req.session;
  if (!accountId) {
    return res.redirect("/");
  }

  try {
    const { code } = req.body;
    await redeemVoucher(accountId, code);
  } catch (err: any) {
    console.error(err);
  } finally {
    return res.send("OK");
  }
});

(async () => {
  await initialize();
  await seed();

  app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
  });
})();
