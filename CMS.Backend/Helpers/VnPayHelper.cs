using System;
using System.Collections.Generic;
using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;

namespace CMS.Backend.Helpers
{
    public class VnPayHelper
    {
        public static string BuildPaymentUrl(
            string baseUrl,
            string tmnCode,
            string hashSecret,
            string returnUrl,
            string ipAddress,
            string txnRef,
            decimal amount,
            string orderInfo)
        {
            if (string.IsNullOrEmpty(ipAddress) || ipAddress.Contains(":"))
            {
                ipAddress = "127.0.0.1";
            }

            var requestData = new SortedList<string, string>(new VnPayCompare());

            requestData.Add("vnp_Version", "2.1.0");
            requestData.Add("vnp_Command", "pay");
            requestData.Add("vnp_TmnCode", tmnCode);
            requestData.Add("vnp_Amount", ((long)(amount * 100)).ToString());
            requestData.Add("vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss"));
            requestData.Add("vnp_CurrCode", "VND");
            requestData.Add("vnp_IpAddr", ipAddress);
            requestData.Add("vnp_Locale", "vn");
            requestData.Add("vnp_OrderInfo", orderInfo);
            requestData.Add("vnp_OrderType", "other");
            requestData.Add("vnp_ReturnUrl", returnUrl);
            requestData.Add("vnp_TxnRef", txnRef);

            var queryBuilder = new StringBuilder();
            var hashBuilder = new StringBuilder();

            foreach (var kv in requestData)
            {
                if (!string.IsNullOrEmpty(kv.Value))
                {
                    queryBuilder.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                    hashBuilder.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                }
            }

            if (hashBuilder.Length > 0)
            {
                hashBuilder.Remove(hashBuilder.Length - 1, 1);
            }
            if (queryBuilder.Length > 0)
            {
                queryBuilder.Remove(queryBuilder.Length - 1, 1);
            }

            string secureHash = HmacSHA512(hashSecret, hashBuilder.ToString());
            return baseUrl + "?" + queryBuilder.ToString() + "&vnp_SecureHash=" + secureHash;
        }

        public static bool ValidateCallback(string hashSecret, IQueryCollection query)
        {
            var responseData = new SortedList<string, string>(new VnPayCompare());
            string vnp_SecureHash = string.Empty;

            foreach (var kv in query)
            {
                if (!string.IsNullOrEmpty(kv.Key) && kv.Key.StartsWith("vnp_"))
                {
                    if (kv.Key == "vnp_SecureHash")
                    {
                        vnp_SecureHash = kv.Value.ToString();
                    }
                    else if (kv.Key != "vnp_SecureHashType")
                    {
                        responseData.Add(kv.Key, kv.Value.ToString());
                    }
                }
            }

            var hashBuilder = new StringBuilder();
            foreach (var kv in responseData)
            {
                if (!string.IsNullOrEmpty(kv.Value))
                {
                    hashBuilder.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                }
            }

            if (hashBuilder.Length > 0)
            {
                hashBuilder.Remove(hashBuilder.Length - 1, 1);
            }

            string calculatedHash = HmacSHA512(hashSecret, hashBuilder.ToString());
            return calculatedHash.Equals(vnp_SecureHash, StringComparison.OrdinalIgnoreCase);
        }

        private static string UrlEncode(string value)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;
            var encoded = WebUtility.UrlEncode(value);
            var sb = new StringBuilder();
            for (int i = 0; i < encoded.Length; i++)
            {
                char c = encoded[i];
                if (c == '%')
                {
                    sb.Append(c);
                    sb.Append(char.ToUpper(encoded[++i]));
                    sb.Append(char.ToUpper(encoded[++i]));
                }
                else
                {
                    sb.Append(c);
                }
            }
            return sb.ToString();
        }

        private static string HmacSHA512(string key, string inputData)
        {
            var hash = new StringBuilder();
            byte[] keyBytes = Encoding.UTF8.GetBytes(key);
            byte[] inputBytes = Encoding.UTF8.GetBytes(inputData);

            using (var hmac = new HMACSHA512(keyBytes))
            {
                byte[] hashValue = hmac.ComputeHash(inputBytes);
                foreach (var theByte in hashValue)
                {
                    hash.Append(theByte.ToString("x2"));
                }
            }
            return hash.ToString();
        }
    }

    public class VnPayCompare : IComparer<string>
    {
        public int Compare(string? x, string? y)
        {
            if (x == y) return 0;
            if (x == null) return -1;
            if (y == null) return 1;
            var vnpCompare = CompareInfo.GetCompareInfo("en-US");
            return vnpCompare.Compare(x, y, CompareOptions.Ordinal);
        }
    }
}
