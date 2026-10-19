export default class ErroHttp extends Error {
    status: number;
    constructor(mensagem: string, status: number) {
        super(mensagem);
        this.status = status;
    }
};