#!/usr/bin/env node
import { Command } from 'commander';
import { init } from '../src/commands/init';

const program = new Command();

program
    .name('gqlify')
    .description('CLI to bootstrap NestJS + GraphQL workflows for Claude Code')
    .version('1.0.0');

program
    .command('init')
    .description('Initialize the .claude workflow in the current directory')
    .action(init);

program.parse();
