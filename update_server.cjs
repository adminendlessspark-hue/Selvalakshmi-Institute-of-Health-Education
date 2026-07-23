const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf-8');

// Find the block for app.get("/register") and app.get(["/", "/index.html"])
const registerRouteStart = server.indexOf('app.get("/register"');
const dynamicHomeEnd = server.indexOf('// Initialize Razorpay lazily');

if (registerRouteStart !== -1 && dynamicHomeEnd !== -1) {
  const extractedRoutes = server.substring(registerRouteStart, dynamicHomeEnd);
  
  // Remove the old routes
  server = server.substring(0, registerRouteStart) + server.substring(dynamicHomeEnd);
  
  // Insert inside startServer
  const startServerRegex = /async function startServer\(\) \{[\s\S]*?if \(process\.env\.NODE_ENV !== "production"\) \{/;
  
  // Actually, let's do a more precise replacement:
  
  server = server.replace(
    /async function startServer\(\) \{/,
    `async function startServer() {
  let viteServer: any = null;`
  );
  
  server = server.replace(
    /const vite = await createViteServer\(\{/,
    `viteServer = await createViteServer({`
  );
  
  server = server.replace(
    /app\.use\(vite\.middlewares\);/,
    `app.use(viteServer.middlewares);`
  );

  // Add the routes before app.listen, or before the static handlers
  // In our case, the routes intercept before static files
  const apiSetupEnd = server.indexOf('if (process.env.NODE_ENV !== "production") {');
  
  let newRoutes = extractedRoutes.replace(
    /res\.send\(html\);/g,
    `if (viteServer) { html = await viteServer.transformIndexHtml(req.originalUrl, html); } res.send(html);`
  );
  
  server = server.substring(0, apiSetupEnd) + newRoutes + server.substring(apiSetupEnd);
  
  fs.writeFileSync('server.ts', server);
  console.log("Updated server.ts successfully");
} else {
  console.error("Could not find blocks to extract");
}
