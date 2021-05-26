const get = (target: any, property: any, receiver: any) => {
    const value = typeof target === 'object' ? Reflect.get(target, property, receiver) : target[property];
    if (typeof value === 'function' && typeof value.bind === 'function') {
        return Object.assign(value.bind(target), value);
    }
    return value;
};

const handler = {
    construct(target: any, argumentsList: any): any {
        if (target.__proxy__) target = target();
        return proxify(Reflect.construct(target, argumentsList));
    },

    get(target: any, property: any, receiver: any): any {
        if (target.__proxy__) target = target();
        if (property !== 'then' && property !== 'catch' && typeof target.then === 'function') {
            return proxify(target.then((value: any) => get(value, property, receiver)));
        }
        return proxify(get(target, property, receiver));
    },

    apply(target: any, thisArg: any, argumentsList: any): any {
        if (target.__proxy__) target = target();
        if (typeof target.then === 'function') {
            return proxify(target.then((value: any) => Reflect.apply(value, thisArg, argumentsList)));
        }
        return proxify(Reflect.apply(target, thisArg, argumentsList));
    },
};

type unPromise<T> = T extends (...args: infer K) => Promise<infer R> ? (...args: K) => unPromisify<R> : T;

type unPromisify<T extends Record<string, any>> = {
    [key in keyof T]: T[key] extends (...args: any[]) => any
        ? unPromise<T[key]>
        : T[key] extends Record<string, any>
        ? unPromisify<T[key]>
        : unPromise<T[key]>;
};

type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

/// Like `promise.then(...)`, but more accurate in types.
declare function customThen<T, U>(p: Promise<T>, onFulfilled: (value: Awaited<T>) => U): Promise<Awaited<U>>;

export const proxify = <T>(target: T): unPromisify<T> => {
    if (typeof target === 'object') {
        const proxy = () => target;
        proxy.__proxy__ = true;
        return new Proxy(proxy, handler);
    }
    return typeof target === 'function' ? new Proxy(target, handler) : target;
};

interface FluentPost {
    first: () => Promise<string>;
    comments: () => Promise<FluentComment>;
}

interface FluentComment {
    first: () => Promise<string>;
}

type a<T> = PromiseLike<T>;

interface FluentUser extends Promise<string> {
    doc: string[];
    posts: (url: string, date: number) => Promise<FluentPost>;
    first: () => Promise<string>;
    all: (imit?: number) => Promise<string[]>;
}

type tee = unPromisify<FluentUser>;
type dee = Awaited<FluentUser>;
