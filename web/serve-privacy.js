const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Set headers for all responses
  res.setHeader("Content-Type", "text/html");

  // Serve privacy-policy.html for all routes
  const filePath = path.join(__dirname, "privacy-policy.html");

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end(`Error loading privacy policy: ${err.code}`);
      return;
    }

    res.writeHead(200);
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Privacy Policy server running at http://localhost:${PORT}`);
  console.log(`Press Ctrl+C to stop the server`);
});
