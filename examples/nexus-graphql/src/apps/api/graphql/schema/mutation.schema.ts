import { interfaceType } from 'nexus';
import { logger } from '@demoapp/libs';

export interface Payload {
    code: string;
    success: boolean;
    message: string;
}

export const MutationPayload = interfaceType({
    name: 'MutationPayload',
    definition(t) {
        t.nonNull.string('code', {
            description: 'Response code to identify status i.e. 200, 400,...',
        });
        t.nonNull.boolean('success', {
            description: 'Whether the mutation had a failure or not',
        });
        t.nonNull.string('message', {
            description: 'A human readable response message describing the result',
        });
    },
});

type Nullable<T extends Record<string, unknown>> = { [key in keyof T]: T[key] | null };

export async function resolveMutation<AdditionalValues extends Record<string, unknown>>(
    resolve: () => Promise<AdditionalValues>,
    options?: { success?: string; failed?: string },
): Promise<Nullable<Partial<AdditionalValues>> & Payload> {
    try {
        const result: AdditionalValues = await resolve();

        return {
            code: '200',
            success: true,
            message: options?.success ?? 'Successful',
            ...result,
        };
    } catch (e) {
        logger.debug(e);
        // @ts-ignore - ts doesn't pick up that Nullable, partial will match
        return {
            code: '400',
            success: false,
            message: e.message ?? options?.failed ?? 'Failed',
        };
    }
}
