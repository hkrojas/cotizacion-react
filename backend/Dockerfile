# Usa una imagen oficial de Python como base
FROM python:3.11-slim

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /code

# Copia el archivo de requerimientos primero para aprovechar el cache de Docker
COPY ./requirements.txt /code/requirements.txt

# Instala las dependencias
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copia todo el código de tu backend al contenedor
COPY ./ /code/

# Expone el puerto que usará la aplicación
EXPOSE 8080

# --- COMANDO CORREGIDO ---
# Ahora le decimos a uvicorn que busque el objeto 'app' en el archivo 'main.py' directamente.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
