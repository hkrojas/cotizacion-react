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
# Fly.io usará este puerto internamente
EXPOSE 8080

# Comando para ejecutar la aplicación cuando el contenedor se inicie
# Uvicorn se ejecutará en el puerto 8080 y será accesible desde cualquier IP dentro de la red de Fly.io
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
