"""Errores del negocio. No saben nada de HTTP: la capa api decide el código."""


class ErrorDominio(Exception):
    def __init__(self, mensaje: str):
        super().__init__(mensaje)
        self.mensaje = mensaje


class DatosInvalidos(ErrorDominio):
    pass


class NoAutorizado(ErrorDominio):
    pass


class NoEncontrado(ErrorDominio):
    pass


class Conflicto(ErrorDominio):
    pass


class DemasiadosIntentos(ErrorDominio):
    pass


class IaNoConfigurada(ErrorDominio):
    pass


class IaNoDisponible(ErrorDominio):
    pass


class BaseNoDisponible(ErrorDominio):
    def __init__(self, causa: str = ""):
        super().__init__("La base de datos no responde. Intenta en un momento.")
        self.causa = causa
