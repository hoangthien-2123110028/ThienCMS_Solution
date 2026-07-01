import express from "express";
import cors from "cors";
import "dotenv/config";
import { VNPay } from "vnpay";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const vnpay = new VNPay({
  tmnCode: process.env.VNP_TMN_CODE,
  secureSecret: process.env.VNP_HASH_SECRET,
  testMode: true,
});

app.get("/payment", (req, res) => {
  const ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  const vnpUrl = vnpay.buildPaymentUrl({
    vnp_Amount: 1000000, // Số tiền thanh toán
    vnp_IpAddr: ipAddr,
    vnp_TxnRef: Date.now(),
    vnp_OrderInfo: "Thanh toan don hang DEMO",
    vnp_ReturnUrl: `http://localhost:8081/PaymentScreen`, // Trang muốn quay về sau khi thanh toán
  });

  console.log("✅ Payment URL:", vnpUrl);
  res.json({ url: vnpUrl });
});

// API kiểm tra trả về từ VNPay
app.get("/", (req, res) => {
  const query = req.query;
  const verify = vnpay.verifyReturnUrl(query);

  console.log("VNPay return query:", query);

  if (verify && query.vnp_ResponseCode === "00") {
    res.send("Thanh toán thành công!");
  } else {
    res.send("Thanh toán thất bại!");
  }
});

app.listen(PORT, () => {
  console.log(`VNPay server running on http://localhost:${PORT}`);
});
