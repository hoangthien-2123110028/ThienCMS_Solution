import { VNPay } from "vnpay";

const vnpay = new VNPay({
  tmnCode: "3J6C23A0",
  secureSecret: "HBPLPZM2TJRUZWD3NY1FXWT15C74W5XO",
  testMode: true,
});

const vnpUrl = vnpay.buildPaymentUrl({
  vnp_Amount: 54000000 / 100, // The library might divide by 100 internally, let's check
  vnp_IpAddr: "127.0.0.1",
  vnp_TxnRef: "5",
  vnp_OrderInfo: "Thanh toan don hang #5",
  vnp_ReturnUrl: "http://localhost:3000/vnpay-return",
  vnp_CreateDate: "20260619161257",
});

console.log("Generated VNPay URL:", vnpUrl);
