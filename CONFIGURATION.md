# Cisco SSH MCP Configuration Examples

## For Cline in VSCode

Add this to your Cline MCP settings:

```json
{
  "mcpServers": {
    "cisco-ssh": {
      "command": "node",
      "args": ["C:/Users/Arosha/cisco-ssh-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

## For Claude Desktop

Add this to your claude_desktop_config.json:

```json
{
  "mcpServers": {
    "cisco-ssh": {
      "command": "node",
      "args": ["C:/Users/Arosha/cisco-ssh-mcp/dist/index.js"]
    }
  }
}
```

## Environment Variables (Optional)

Create a .env file for default connection settings:

```bash
CISCO_DEFAULT_HOST=192.168.1.1
CISCO_DEFAULT_USERNAME=admin
CISCO_DEFAULT_PORT=22
CISCO_DEFAULT_TIMEOUT=10000
```

## Example Usage Commands

### Connect to a device:
```json
{
  "tool": "cisco_connect",
  "arguments": {
    "host": "192.168.1.1",
    "username": "admin",
    "password": "your_password",
    "connectionId": "router1"
  }
}
```

### Show interface status:
```json
{
  "tool": "cisco_show",
  "arguments": {
    "command": "show ip interface brief",
    "parseOutput": true
  }
}
```

### Configure an interface:
```json
{
  "tool": "cisco_config",
  "arguments": {
    "commands": [
      "interface GigabitEthernet0/1",
      "description Connected to Server",
      "ip address 192.168.10.1 255.255.255.0",
      "no shutdown"
    ],
    "save": true
  }
}
```
