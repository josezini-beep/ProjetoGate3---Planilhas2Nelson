"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./db/db"));
function iniciar() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield db_1.default.query("SELECT 1");
            console.log("Conectado ao PostgreSQL!");
            app_1.default.listen(3000, () => {
                console.log("Servidor rodando na porta 3000");
            });
        }
        catch (erro) {
            console.error("Erro ao iniciar:", erro);
            yield db_1.default.end();
            process.exitCode = 1;
        }
    });
}
iniciar();
