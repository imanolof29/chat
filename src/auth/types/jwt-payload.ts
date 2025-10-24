export type TokenType = "access" | "refresh";

export type JwtPayload = {
    sub: string;
    email: string;
    type: TokenType;
}