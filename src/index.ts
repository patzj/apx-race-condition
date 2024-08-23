import express, { Request, Response } from "express";
import session from "express-session";
import path from "node:path";
import { initialize, seed } from "./utils/db";
import { toCurrency } from "./utils/format";
import { appSecret } from "./utils/security";

const app = express();
const port = process.env.PORT ?? 3000;

app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

app.use(
  session({
    secret: appSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

app.get("/", (_: Request, res: Response) => {
  return res.render("index", {
    page: "Home",
    balance: toCurrency(10.0),
  });
});

(async () => {
  await initialize();
  await seed();

  app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
  });
})();
