import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

export async function init() {
    const targetDir = path.join(process.cwd(), '.claude');
    // Navigate up from dist/src/commands/init.js -> dist/src/commands -> dist/src -> dist -> root -> templates
    // The actual structure after build is dist/bin/gqlify.js and dist/src/commands/init.js
    // We need to resolve relative to __dirname (dist/src/commands)
    const templateDir = path.resolve(__dirname, '../../../templates/.claude');

    console.log(chalk.blue('🚀 Initializing GQLify workflow for Claude Code...'));
    console.log(chalk.gray('   NestJS + GraphQL development toolkit\n'));

    try {
        if (await fs.pathExists(targetDir)) {
            console.log(chalk.yellow('⚠️  .claude directory already exists. Skipping initialization.'));
            console.log(chalk.gray('   To reinstall, remove the existing .claude directory first.'));
            return;
        }

        console.log(chalk.gray(`📦 Copying templates from ${templateDir}...`));
        await fs.copy(templateDir, targetDir);

        console.log(chalk.green('\n✅ Successfully created .claude directory!\n'));

        // Show what was installed
        console.log(chalk.cyan('📚 Installed Resources:'));
        console.log(chalk.gray('   • 20 executable skills for code generation'));
        console.log(chalk.gray('   • Architecture & conventions documentation'));
        console.log(chalk.gray('   • Security audit guides'));
        console.log(chalk.gray('   • Testing patterns & templates\n'));

        console.log(chalk.cyan('🎯 Available Skills:'));
        console.log(chalk.gray('   Core Generation:'));
        console.log(chalk.white('     /gqlify:generate-module <Entity>  ') + chalk.gray('- Scaffold complete module'));
        console.log(chalk.white('     /gqlify:generate-field <Module>   ') + chalk.gray('- Add DataLoader field'));
        console.log(chalk.white('     /gqlify:add-field <Module>        ') + chalk.gray('- Add entity property'));

        console.log(chalk.gray('\n   Advanced Features:'));
        console.log(chalk.white('     /gqlify:add-export <Module>       ') + chalk.gray('- CSV/Excel export'));
        console.log(chalk.white('     /gqlify:add-filter <Module>       ') + chalk.gray('- Advanced filtering'));
        console.log(chalk.white('     /gqlify:add-i18n <Module>         ') + chalk.gray('- Internationalization'));
        console.log(chalk.white('     /gqlify:add-pagination <Module>   ') + chalk.gray('- Paginated responses'));

        console.log(chalk.gray('\n   Code Quality:'));
        console.log(chalk.white('     /gqlify:validate [--fix]          ') + chalk.gray('- Validate code patterns'));
        console.log(chalk.white('     /gqlify:audit-security            ') + chalk.gray('- Security audit'));
        console.log(chalk.white('     /gqlify:setup                     ') + chalk.gray('- Verify project setup'));

        console.log(chalk.gray('\n   See all 20 skills: ls .claude/skills/\n'));

        console.log(chalk.cyan('📖 Next Steps:'));
        console.log(chalk.gray('   1. Read .claude/README.md for overview'));
        console.log(chalk.gray('   2. Review .claude/RULES.md for key constraints'));
        console.log(chalk.gray('   3. Try: /gqlify:generate-module Product'));
        console.log(chalk.gray('   4. Start building with Claude Code!\n'));

    } catch (error) {
        console.error(chalk.red('\n❌ Error initializing workflow:'), error);
        console.error(chalk.yellow('\n💡 Troubleshooting:'));
        console.error(chalk.gray('   • Ensure you have write permissions in this directory'));
        console.error(chalk.gray('   • Check that GQLify is properly installed'));
        console.error(chalk.gray('   • Try running with elevated permissions if needed\n'));
        process.exit(1);
    }
}
