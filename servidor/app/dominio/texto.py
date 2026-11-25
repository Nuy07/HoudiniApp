def limpio(valor, maximo: int) -> str | None:
    """Texto sin espacios sobrantes, o None si está vacío o es muy largo."""
    if not isinstance(valor, str):
        return None
    valor = valor.strip()
    return valor if 0 < len(valor) <= maximo else None
