/* eslint-disable require-jsdoc */

/**
 * Allows you to create many different errors in the same place.
 */
 export default class LogManager {
  private primaryContext = 'unspecified';
  private furtherContext: string[] = [];

  /**
   * Sets the logging context that's displayed on every log
   * @param {string} primaryContext The main context
   * @param {string[]} furtherContext Contexts following the main context, inside of it
   * @return {LogManager}
   */
  public updateContext(primaryContext?: string, furtherContext?: string[]): LogManager {
    if (primaryContext) this.primaryContext = primaryContext;
    if (furtherContext) this.furtherContext = furtherContext;

    return this;
  }

  /**
   * Copies the logging context for modificiation
   * @param {string[]} furtherContext Inner context to expand upon
   * @return {LogManager}
   */
  public customContext(furtherContext: string[]): LogManager {
    return new LogManager().updateContext(this.primaryContext, furtherContext);
  }

  public logError(logMessage: string) {
    const context = `[${this.primaryContext}/${this.furtherContext.join('/')}]`;
    console.error(`${context} ${logMessage}`);

    return {
      throw() {
        return new Error(logMessage);
      },
      end() {
        return null;
      },
    };
  }

  public error(logMessage: string) {
    const context = `@ (${this.primaryContext}/${this.furtherContext.join('/')})`;

    return new Error(`${context} ${logMessage}`);
  }

  public log(logMessage: string): void {
    const context = `[${this.primaryContext}/${this.furtherContext.join('/')}]`;
    console.log(`${context} ${logMessage}`);
  }
}
