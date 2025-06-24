# Cisco SSH MCP Server

A Model Context Protocol (MCP) server for managing SSH connections to Cisco network devices. This server provides tools for connecting to, configuring, and monitoring Cisco routers and switches through SSH.

## Features

- **Multiple SSH Connections**: Manage connections to multiple Cisco devices simultaneously
- **Command Execution**: Execute any CLI command on connected devices
- **Configuration Management**: Enter config mode and apply configuration changes
- **Show Commands**: Execute show commands with optional output parsing
- **Raw Terminal Access**: Send raw text for interactive sessions
- **Connection Management**: List, connect, and disconnect from devices
- **Secure Authentication**: Support for password and key-based authentication

## Installation

```bash
npm install
npm run build
```

## Usage

### As an MCP Server

Configure your MCP client (like Cline) to use this server:

```json
{
  "mcpServers": {
    "cisco-ssh": {
      "command": "node",
      "args": ["path/to/cisco-ssh-mcp/dist/index.js"]
    }
  }
}
```

### Command Line Usage

```bash
# Start the MCP server
npm start

# Start with default connection parameters
cisco-ssh-mcp --host 192.168.1.1 --username admin
```

## Available Tools

### cisco_connect
Connect to a Cisco device via SSH.

**Parameters:**
- `host` (required): IP address or hostname
- `username` (required): SSH username
- `password`: SSH password
- `privateKey`: Private key for authentication
- `port`: SSH port (default: 22)
- `connectionId`: Unique identifier for the connection

### cisco_exec
Execute a command on a connected device.

**Parameters:**
- `command` (required): Command to execute
- `connectionId`: Which connection to use
- `timeout`: Command timeout in milliseconds

### cisco_config
Enter configuration mode and execute configuration commands.

**Parameters:**
- `commands` (required): Array of configuration commands
- `connectionId`: Which connection to use
- `save`: Whether to save config after changes

### cisco_show
Execute show commands with optional output parsing.

**Parameters:**
- `command` (required): Show command to execute
- `connectionId`: Which connection to use
- `parseOutput`: Parse output into structured format

### cisco_send_raw
Send raw text to the SSH connection.

**Parameters:**
- `text` (required): Raw text to send
- `connectionId`: Which connection to use
- `waitForPrompt`: Wait for command prompt

### cisco_list_connections
List all active SSH connections.

### cisco_disconnect
Disconnect from a device.

**Parameters:**
- `connectionId`: Connection to disconnect

## Examples

### Connecting to a Device

```javascript
// Connect using password
{
  "tool": "cisco_connect",
  "arguments": {
    "host": "192.168.1.1",
    "username": "admin",
    "password": "cisco123",
    "connectionId": "router1"
  }
}

// Connect using SSH key
{
  "tool": "cisco_connect",
  "arguments": {
    "host": "192.168.1.1",
    "username": "admin",
    "privateKey": "-----BEGIN RSA PRIVATE KEY-----\\n...",
    "connectionId": "router1"
  }
}
```

### Executing Commands

```javascript
// Show interface status
{
  "tool": "cisco_show",
  "arguments": {
    "command": "show ip interface brief",
    "parseOutput": true
  }
}

// Configure an interface
{
  "tool": "cisco_config",
  "arguments": {
    "commands": [
      "interface GigabitEthernet0/1",
      "ip address 192.168.10.1 255.255.255.0",
      "no shutdown"
    ],
    "save": true
  }
}
```

## Security Considerations

- Use SSH keys instead of passwords when possible
- Implement proper network segmentation for management traffic
- Enable logging for all commands executed
- Use dedicated management VLANs
- Implement proper access controls and authentication

## Troubleshooting

- **Connection Timeout**: Check network connectivity and SSH service on device
- **Authentication Failed**: Verify credentials and SSH configuration
- **Command Timeout**: Increase timeout values for slow devices
- **Permission Denied**: Ensure user has appropriate privileges

## License

MIT License - see LICENSE file for details.
