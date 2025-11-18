async function onPayPalWebSdkLoaded() {
  try {
    // Get client token for authentication
    const clientToken = await getBrowserSafeClientToken();
    
    // Create PayPal SDK instance
    const sdkInstance = await window.paypal.createInstance({
      clientToken,
      components: ["paypal-payments"],
      pageType: "checkout",
    });

    // Check eligibility for all payment methods
    const paymentMethods = await sdkInstance.findEligibleMethods({
      currencyCode: "USD",
    });

    // Set up PayPal button if eligible
    if (paymentMethods.isEligible("paypal")) {
      setUpPayPalButton(sdkInstance);
    }
  } catch (error) {
    console.error("SDK initialization error:", error);
  }
}

// Shared payment session options for all payment methods
const paymentSessionOptions = {
  // Called when user approves a payment 
  async onApprove(data) {
    console.log("Payment approved:", data);
    try {
      const orderData = await captureOrder({
        orderId: data.orderId,
      });
      console.log("Payment captured successfully:", orderData);
    } catch (error) {
      console.error("Payment capture failed:", error);
    }
  },
  
  // Called when user cancels a payment
  onCancel(data) {
    console.log("Payment cancelled:", data);
  },
  
  // Called when an error occurs during payment
  onError(error) {
    console.error("Payment error:", error);
  },
};

// Set up standard PayPal button
async function setUpPayPalButton(sdkInstance) {
  const paypalPaymentSession = sdkInstance.createPayPalOneTimePaymentSession(
    paymentSessionOptions,
  );

  const paypalButton = document.querySelector("paypal-button");
  paypalButton.removeAttribute("hidden");

//   paypalButton.addEventListener("click", async () => {
    
//     try {
//       await paypalPaymentSession.start(
//         { presentationMode: "auto" }, // Auto-detects best presentation mode
//         createOrder(),
//       );
//     } catch (error) {
//       console.error("PayPal payment start error:", error);
//     }
//   });
paypalButton.addEventListener("click", async () => {
  try {
    const orderPromise = createOrder();

    // 👉 ép thành native Promise (bỏ zone.js)
    const nativePromise = window.Promise.resolve(orderPromise);

    await paypalPaymentSession.start(
      { presentationMode: "auto" },
      nativePromise
    );
  } catch (error) {
    console.error("PayPal payment start error:", error);
  }
});

}

async function getBrowserSafeClientToken() {
    var token = localStorage.getItem("access_token")
    
    const response = await fetch("http://localhost:8081/api/v1/payment/paypal/auth/browser-safe-client-token", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
        "x-api-key":"ab827ed2-86c2-5c7f-8eee-0326d169f0da"
        },
    });
    
    const res = await response.json();
    const clientToken = res.data[0];
    
    return clientToken;
}

async function createOrder() {
  const token = localStorage.getItem("access_token");

  return fetch("http://localhost:8081/api/v1/payment/paypal/checkout/orders/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token,
      "x-api-key": "ab827ed2-86c2-5c7f-8eee-0326d169f0da",
    },
  })
    .then(response => response.json())
    .then(data => {
      
      return { orderId: data.id }; // <-- bắt buộc dạng này
    });
}

async function captureOrder({ orderId }) {
    var token = localStorage.getItem("access_token")
  const response = await fetch(
    `http://localhost:8081/api/v1/payment/paypal/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
        "x-api-key":"ab827ed2-86c2-5c7f-8eee-0326d169f0da"
      },
    },
  );
  const data = await response.json();
  return data;
}