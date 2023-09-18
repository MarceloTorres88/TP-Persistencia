# TP-Persistencia

## Pasos para correr el repositorio:

1-  Clonar el repositorio:
- Abrir una consola cmd o bash.

    git clone https://github.com/MarceloTorres88/TP-Persistencia.git 

2 - Configurar Json:
- Antes de actualizar la base con la migración debemos entrar el archivo en config.json dentro de config.
- Modificar la constraseña creada para la base de datos.

3- Crear base de datos:
- El nombre correspondiente a la base de datos se encuentra dentro del archivo config.json.
- Debemos correr Xampp y abrir en el browser la siguiente página: http://localhost/phpmyadmin/
- Una vez dentro, debemos crear a mano la base de datos con el nombre anteriormente mencionado.

4- Correr la migracion para actualizar los archivos en la base de datos:
- Para eso debemos abrir una terminal, posicionarnos en la carpeta api dentro de la carpeta TP-Persistencia.
- utilizaremos 'cd api' para movernos y luego actualizamos 'npx sequelize db:migrate'.

5- Para terminar:
- Dentro de la terminal correr el comando 'npm start'
