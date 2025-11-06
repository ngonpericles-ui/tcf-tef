import { PrismaClient } from '@prisma/client';
declare const prisma: PrismaClient<{
    datasources: {
        db: {
            url: string;
        };
    };
    log: ("error" | "warn")[];
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const checkDatabaseHealth: () => Promise<{
    healthy: boolean;
    details: any;
}>;
export { prisma };
export default prisma;
//# sourceMappingURL=database.d.ts.map