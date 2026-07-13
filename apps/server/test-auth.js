async function test() {
  try {
    console.log("Testing Registration...");
    const regRes = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "testuser@example.com",
        password: "password123",
        fullName: "Test User"
      })
    });
    const regData = await regRes.json();
    console.log("Registration Response:", regData);

    if (regData.success) {
      console.log("\nTesting Login...");
      const loginRes = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "testuser@example.com",
          password: "password123"
        })
      });
      const loginData = await loginRes.json();
      console.log("Login Response:", loginData);

      const token = loginData.data.token;
      
      console.log("\nTesting GetMe...");
      const meRes = await fetch("http://localhost:5000/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const meData = await meRes.json();
      console.log("GetMe Response:", meData);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}
test();
