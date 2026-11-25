import hashlib
import hmac
import secrets

from app.dominio.entidades import Credencial


class HuellasScrypt:
    def crear(self, clave: str) -> tuple[str, str]:
        sal = secrets.token_hex(16)
        return sal, self._scrypt(clave, sal).hex()

    def coincide(self, clave: str, credencial: Credencial | None) -> bool:
        # Sin credencial se calcula igual, para tardar lo mismo.
        huella = self._scrypt(clave, credencial.sal if credencial else "x")
        return credencial is not None and hmac.compare_digest(huella, bytes.fromhex(credencial.hash))

    @staticmethod
    def _scrypt(clave: str, sal: str) -> bytes:
        return hashlib.scrypt(clave.encode(), salt=sal.encode(), n=2**14, r=8, p=1, dklen=32)
