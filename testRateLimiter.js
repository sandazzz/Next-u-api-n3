const axios = require("axios");

const testRateLimiter = async () => {
  const url = "http://localhost:3000/api/todos";
  const totalRequests = 50; 
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NDA0YmMzYjhjYTZiODA3MjJhY2QxOCIsInVzZXJuYW1lIjoiQWxleDAiLCJpYXQiOjE3MzIyNjcyMzEsImV4cCI6MTczMjM1MzYzMX0.2gz_8b4VqCIoulidcoanGpNXjoywgf5xjTcEKwmkBWo";

  for (let i = 1; i <= totalRequests; i++) {
    try {
      const response = await axios.get(url, {
        headers: {
          "x-access-token": token, 
        },
      });
      console.log(`Request ${i}:`, response.data);
    } catch (error) {
      if (error.response) {
        console.log(`Request ${i} failed:`, error.response.status, error.response.data);
      } else {
        console.log(`Request ${i} failed:`, error.message);
      }
    }
  }
};

testRateLimiter();
