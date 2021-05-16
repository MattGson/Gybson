import chalk from 'chalk';

export const logger = {
    debug(...args: any[]): void {
        console.log(chalk.blue(...args));
        console.log('\n');
    },
    info(...args: any[]): void {
        console.log(chalk.green(...args));
        console.log('\n');
    },
    warn(...args: any[]): void {
        console.log(chalk.yellow(...args));
        console.log('\n');
    },
    error(...args: any[]): void {
        console.log(chalk.red(...args));
        console.log('\n');
    },
};
