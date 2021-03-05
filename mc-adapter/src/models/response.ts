export type Empty = null;

export class Response<T> {
    /**
     * A response to the client about success. To return an error, simply
     * throw an error in the route.
     *
     * If the body is `null`, no message will be send back.
     */
    constructor(public body: T | null = null) {
        //
    }

    /**
     * Doesn't send any message back.
     */
    public static empty(): Response<Empty> {
        return new Response();
    }
}
