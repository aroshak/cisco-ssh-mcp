@echo off
echo Installing dependencies...
call npm install

echo.
echo Building TypeScript...
call npm run build

echo.
echo Testing build...
if exist "dist\index.js" (
    echo ✅ Build successful - dist/index.js created
) else (
    echo ❌ Build failed - dist/index.js not found
    exit /b 1
)

echo.
echo ✅ Setup complete! 
echo.
echo To use with Cline, add this to your MCP settings:
echo {
echo   "mcpServers": {
echo     "cisco-ssh": {
echo       "command": "node",
echo       "args": ["C:/Users/Arosha/cisco-ssh-mcp/dist/index.js"]
echo     }
echo   }
echo }
