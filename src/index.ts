#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { program } from 'commander';
import { SSHManager } from './ssh-manager.js';

interface CiscoSSHServerOptions {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  timeout?: number;
}

class CiscoSSHMCPServer {
  private server: Server;
  private sshManager: SSHManager;
  private options: CiscoSSHServerOptions;

  constructor(options: CiscoSSHServerOptions = {}) {
    this.options = options;
    this.sshManager = new SSHManager();
    
    this.server = new Server(
      {
        name: 'cisco-ssh-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: 'cisco_connect',
          description: 'Connect to a Cisco device via SSH',
          inputSchema: {
            type: 'object',
            properties: {
              host: {
                type: 'string',
                description: 'IP address or hostname of the Cisco device',
              },
              port: {
                type: 'number',
                description: 'SSH port (default: 22)',
                default: 22,
              },
              username: {
                type: 'string',
                description: 'SSH username',
              },
              password: {
                type: 'string',
                description: 'SSH password (if not using key)',
              },
              privateKey: {
                type: 'string',
                description: 'Private key for SSH authentication',
              },
              passphrase: {
                type: 'string',
                description: 'Passphrase for private key',
              },
              connectionId: {
                type: 'string',
                description: 'Unique identifier for this connection (default: host)',
              },
            },
            required: ['host', 'username'],
          },
        },
        {
          name: 'cisco_disconnect',
          description: 'Disconnect from a Cisco device',
          inputSchema: {
            type: 'object',
            properties: {
              connectionId: {
                type: 'string',
                description: 'Connection ID to disconnect (default: use default connection)',
              },
            },
          },
        },
        {
          name: 'cisco_exec',
          description: 'Execute a command on a connected Cisco device',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'Command to execute',
              },
              connectionId: {
                type: 'string',
                description: 'Connection ID to use (default: use default connection)',
              },
              timeout: {
                type: 'number',
                description: 'Command timeout in milliseconds (default: 10000)',
                default: 10000,
              },
            },
            required: ['command'],
          },
        },
        {
          name: 'cisco_config',
          description: 'Enter configuration mode and execute configuration commands',
          inputSchema: {
            type: 'object',
            properties: {
              commands: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'Array of configuration commands to execute',
              },
              connectionId: {
                type: 'string',
                description: 'Connection ID to use (default: use default connection)',
              },
              save: {
                type: 'boolean',
                description: 'Save configuration after applying changes (default: false)',
                default: false,
              },
            },
            required: ['commands'],
          },
        },
        {
          name: 'cisco_show',
          description: 'Execute show commands and parse structured output',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'Show command to execute',
              },
              connectionId: {
                type: 'string',
                description: 'Connection ID to use (default: use default connection)',
              },
              parseOutput: {
                type: 'boolean',
                description: 'Attempt to parse output into structured format (default: false)',
                default: false,
              },
            },
            required: ['command'],
          },
        },
        {
          name: 'cisco_list_connections',
          description: 'List all active SSH connections',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'cisco_send_raw',
          description: 'Send raw text to the SSH connection (for interactive sessions)',
          inputSchema: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'Raw text to send',
              },
              connectionId: {
                type: 'string',
                description: 'Connection ID to use (default: use default connection)',
              },
              waitForPrompt: {
                type: 'boolean',
                description: 'Wait for command prompt after sending (default: true)',
                default: true,
              },
            },
            required: ['text'],
          },
        },
      ];

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'cisco_connect':
            return await this.handleConnect(args);
          case 'cisco_disconnect':
            return await this.handleDisconnect(args);
          case 'cisco_exec':
            return await this.handleExec(args);
          case 'cisco_config':
            return await this.handleConfig(args);
          case 'cisco_show':
            return await this.handleShow(args);
          case 'cisco_list_connections':
            return await this.handleListConnections();
          case 'cisco_send_raw':
            return await this.handleSendRaw(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async handleConnect(args: any) {
    const connectionId = args.connectionId || args.host;
    
    const result = await this.sshManager.connect(connectionId, {
      host: args.host,
      port: args.port || 22,
      username: args.username,
      password: args.password,
      privateKey: args.privateKey,
      passphrase: args.passphrase,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Successfully connected to ${args.host} (${connectionId})\\nDevice info: ${result}`,
        },
      ],
    };
  }

  private async handleDisconnect(args: any) {
    const connectionId = args.connectionId;
    await this.sshManager.disconnect(connectionId);

    return {
      content: [
        {
          type: 'text',
          text: `Disconnected from ${connectionId || 'default connection'}`,
        },
      ],
    };
  }

  private async handleExec(args: any) {
    const result = await this.sshManager.executeCommand(
      args.command,
      args.connectionId,
      args.timeout
    );

    return {
      content: [
        {
          type: 'text',
          text: `Command: ${args.command}\\n\\nOutput:\\n${result}`,
        },
      ],
    };
  }

  private async handleConfig(args: any) {
    const result = await this.sshManager.configureDevice(
      args.commands,
      args.connectionId,
      args.save
    );

    return {
      content: [
        {
          type: 'text',
          text: `Configuration commands executed:\\n${result}`,
        },
      ],
    };
  }

  private async handleShow(args: any) {
    const result = await this.sshManager.executeShowCommand(
      args.command,
      args.connectionId,
      args.parseOutput
    );

    return {
      content: [
        {
          type: 'text',
          text: `Show command: ${args.command}\\n\\nOutput:\\n${result}`,
        },
      ],
    };
  }

  private async handleListConnections() {
    const connections = this.sshManager.listConnections();

    return {
      content: [
        {
          type: 'text',
          text: `Active connections:\\n${JSON.stringify(connections, null, 2)}`,
        },
      ],
    };
  }

  private async handleSendRaw(args: any) {
    const result = await this.sshManager.sendRaw(
      args.text,
      args.connectionId,
      args.waitForPrompt
    );

    return {
      content: [
        {
          type: 'text',
          text: `Sent: ${args.text}\\n\\nResponse:\\n${result}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Cisco SSH MCP server running on stdio');
  }
}

// CLI interface
program
  .name('cisco-ssh-mcp')
  .description('MCP server for SSH connections to Cisco network devices')
  .version('1.0.0')
  .option('-h, --host <host>', 'Default host to connect to')
  .option('-p, --port <port>', 'Default SSH port', '22')
  .option('-u, --username <username>', 'Default SSH username')
  .option('-k, --private-key <path>', 'Path to private key file')
  .action(async (options) => {
    const server = new CiscoSSHMCPServer(options);
    await server.run();
  });

if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

export { CiscoSSHMCPServer };
