/**
 * Express-style middleware chain for request processing.
 */

export type Request = {
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
};

export type Response = {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
};

export type NextFunction = (err?: Error) => void;
export type Middleware = (req: Request, res: Response, next: NextFunction) => void;
export type ErrorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => void;

export class MiddlewareChain {
  private middlewares: Middleware[] = [];
  private errorHandler: ErrorMiddleware | null = null;

  /**
   * Register a middleware function.
   */
  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Register an error handler (should be called last in setup).
   */
  useErrorHandler(handler: ErrorMiddleware): void {
    this.errorHandler = handler;
  }

  /**
   * Create a logging middleware.
   */
  static createLogger(): Middleware {
    return (req, _res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.path}`);
      next();
    };
  }

  /**
   * Create an authentication middleware that checks for a Bearer token.
   */
  static createAuthCheck(): Middleware {
    return (req, res, next) => {
      const authHeader = req.headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.statusCode = 401;
        res.body = { error: "Unauthorized" };
        return;
      }
      next();
    };
  }

  /**
   * Create a catch-all middleware that handles any unmatched request.
   */
  static createCatchAll(): Middleware {
    return (_req, res, _next) => {
      res.statusCode = 404;
      res.body = { error: "Not found" };
    };
  }

  /**
   * Build and return the composed middleware pipeline.
   */
  build(): (req: Request, res: Response) => void {
    const chain = [...this.middlewares];

    return (req: Request, res: Response) => {
      let index = 0;

      const next = (err?: Error) => {
        if (err && this.errorHandler) {
          this.errorHandler(err, req, res, next);
          return;
        }

        if (index >= chain.length) {
          return;
        }

        const middleware = chain[index++];
        try {
          middleware(req, res, next);
        } catch (e) {
          if (this.errorHandler) {
            this.errorHandler(e as Error, req, res, next);
          } else {
            res.statusCode = 500;
            res.body = { error: "Internal server error" };
          }
        }
      };

      next();
    };
  }

  /**
   * Convenience: build a typical pipeline with auth, logging, catch-all.
   */
  buildDefaultPipeline(): (req: Request, res: Response) => void {
    this.use(MiddlewareChain.createLogger());
    this.use(MiddlewareChain.createAuthCheck());
    this.use(MiddlewareChain.createCatchAll());
    return this.build();
  }
}
