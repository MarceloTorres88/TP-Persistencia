var express = require("express");
var router = express.Router();
var models = require("../models");
var jwt = require("jsonwebtoken");

const claveSecreta = process.env.clave_secreta;

// Autorización
function verificar(req,res,next){
    const bearerHeader = req.headers['authorization'];
    if(typeof bearerHeader !== 'undefined'){
        /* si es distinto a undefined guardo solamente el token sin el Bearer <token>*/
        const tokenVerificado = bearerHeader.split(" ")[1];
        req.token = tokenVerificado;
        next();
    }else{
        res.sendStatus(403);
    }
}

router.get("/", (req, res) => {
    console.log("Obteniendo horarios");
    models.horario
    .findAll({
        attributes: ["id", "dia", "inicio", "fin","id_materia"],
        include:[
            {as:'materia_relacionada',model:models.materia,attributes:["id","nombre","id_carrera"]}
        ]
    })
    .then(horarios => res.send(horarios))
    .catch(() => res.sendStatus(500));
});

router.post("/",verificar, (req, res) => {
    jwt.verify(req.token,claveSecreta,(error,authData) => {
        if(error){
            /* acceso prohibido */
            res.sendStatus(403);
        }else{
        models.horario
        .create({ dia: req.body.dia, inicio: req.body.inicio, fin: req.body.fin, id_materia: req.body.id_materia })
        .then(horario => res.status(201).send({ id: horario.id, authData }))
        .catch(error => {
            if (error == "SequelizeUniqueConstraintError: Validation error") {
                res.status(400).send('Bad request: error al crear horario')
            }
            else {
                console.log(`Error al intentar insertar en la base de datos: ${error}`)
                res.sendStatus(500)
            }
            });
        }
    })
});

const findHorario = (id, { onSuccess, onNotFound, onError }) => {
    models.horario
    .findOne({
        attributes: ["id", "dia", "inicio", "fin","id_materia"],
        include:[
            {as:'materia_relacionada',model:models.materia,attributes:["id","nombre","id_carrera"]}
        ],
        where: { id }
    })
    .then(horario => (horario ? onSuccess(horario) : onNotFound()))
    .catch(() => onError());
};

router.get("/:id", (req, res) => {
    findHorario(req.params.id, {
        onSuccess: horario => res.send(horario),
        onNotFound: () => res.sendStatus(404),
        onError: () => res.sendStatus(500)
    });
});

router.put("/:id",verificar, (req, res) => {
    jwt.verify(req.token,claveSecreta,(error,authData) => {
        if(error){
            /* acceso prohibido */
            res.sendStatus(403);
        }else{
            const onSuccess = horario =>
            horario
            .update({ dia: req.body.dia, inicio: req.body.inicio,fin: req.body.fin, id_materia: req.body.id_materia }, { fields: ["dia","inicio","fin","id_materia"] })
            .then(() => res.sendStatus(200),authData) /* en revision */
            .catch(error => {
                if (error == "SequelizeUniqueConstraintError: Validation error") {
                    res.status(400).send('Bad request: error al intentar actualizar horario')
                }
                else {
                    console.log(`Error al intentar actualizar la base de datos: ${error}`)
                    res.sendStatus(500)
                }
            });
            findHorario(req.params.id, {
            onSuccess,
            onNotFound: () => res.sendStatus(404),
            onError: () => res.sendStatus(500)
            });
        }
    })
});

router.delete("/:id",verificar, (req, res) => {
    jwt.verify(req.token,claveSecreta,(error,authData) => {
        if(error){
            /* acceso prohibido */
            res.sendStatus(403);
        }else{
            const onSuccess = horario =>
            horario
                .destroy()
                .then(() => res.sendStatus(200),authData)
                .catch(() => res.sendStatus(500));
            findHorario(req.params.id, {
            onSuccess,
            onNotFound: () => res.sendStatus(404),
            onError: () => res.sendStatus(500)
            });
        }
    })
});

module.exports = router;