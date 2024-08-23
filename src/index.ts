import express, { Request, Response } from "express";
import session from "express-session";

import path from "node:path";
import {
  buyItem,
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
    flag: "",
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
  let flag = "";

  try {
    const { itemId } = req.body;
    const result = await buyItem(accountId, itemId);

    balance = result.balance;
    code = result.code;
    flag = result.flag;
  } catch (err: any) {
    console.error(err);
    return res.render("index", {
      page: "Home",
      code,
      flag,
      error: err.message,
      balance: toCurrency(balance),
    });
  }

  return res.render("index", {
    page: "Home",
    code,
    flag,
    error: "",
    balance: toCurrency(balance),
  });
});

app.get("/redeem", async (req: Request, res: Response) => {
  const { accountId } = req.session;
  if (!accountId) {
    return res.redirect("/");
  }

  const balance = await getBalance(accountId);
  return res.render("redeem", {
    page: "Redeem Gift Card",
    error: "",
    success: "",
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

    const balance = await getBalance(accountId);
    return res.render("redeem", {
      page: "Redeem Gift Card",
      error: err.message,
      success: "",
      balance: toCurrency(balance),
    });
  }

  const balance = await getBalance(accountId);
  return res.render("redeem", {
    page: "Redeem Gift Card",
    error: "",
    success: "Balance updated.",
    balance: toCurrency(balance),
  });
});

(async () => {
  await initialize();
  await seed();

  app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
  });
})();
