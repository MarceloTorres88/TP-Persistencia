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
    console.log("Obteniendo datos de la biblioteca");
    models.biblioteca
    .findAll({
        attributes: ["id", "autor", "titulo","fecha"],
        include:[
            {as:'profesor_relacionada',model:models.biblioteca,attributes:["id","nombre","apellido","edad"]}
        ]
    })
    .then(biblioteca => res.send(biblioteca))
    .catch(() => res.sendStatus(500));
});

router.post("/",verificar, (req, res) => {
    jwt.verify(req.token,claveSecreta,(error,authData)=>{
        if(error){
            /* acceso prohibido */ 
            res.sendStatus(403);
        }else{
            models.biblioteca
            .create({ autor: req.body.autor,titulo: req.body.titulo,fecha: req.body.fecha })
            .then(biblioteca => res.status(201).send({ id: biblioteca.id,authData }))
            .catch(error => {
                if (error == "SequelizeUniqueConstraintError: Validation error") {
                    res.status(400).send('Bad request: existe otro libro con el mismo nombre')
                }
                else {
                    console.log(`Error al intentar insertar un libro en la base de datos: ${error}`)
                    res.sendStatus(500)
                }
            });
        }
    })  
});

const findMateria = (id, { onSuccess, onNotFound, onError }) => {
    models.biblioteca
    .findOne({
        attributes: ["id", "autor", "titulo","fecha"],
        include:[
            {as:'profesor_relacionada',model:models.biblioteca,attributes:["id","nombre","apellido","edad"]}
        ],
        where: { id }
    })
    .then(biblioteca => (biblioteca ? onSuccess(biblioteca) : onNotFound()))
    .catch(() => onError());
};

router.get("/:id", (req, res) => {
    findMateria(req.params.id, {
        onSuccess: biblioteca => res.send(biblioteca),
        onNotFound: () => res.sendStatus(404),
        onError: () => res.sendStatus(500)
    });
});

router.put("/:id", (req, res) => {
    jwt.verify(req.token,claveSecreta,(error,authData)=>{
        if(error){
            /* acceso prohibido*/
            res.sendStatus(403);
        }else{
            const onSuccess = biblioteca =>
            biblioteca
            .update({ autor: req.body.autor, titulo: req.body.titulo, fecha: req.body.fecha },{ fields: ["autor","titulo","fecha"] })
            .then(() => res.sendStatus(200))
            .catch(error => {
                if (error == "SequelizeUniqueConstraintError: Validation error") {
                    res.status(400).send('Bad request: existe otro libro con el mismo nombre')
                }
                else {
                    console.log(`Error al intentar actualizar la base de datos: ${error}`)
                    res.sendStatus(500)
                }
            });
            findMateria(req.params.id, {
            onSuccess,
            onNotFound: () => res.sendStatus(404),
            onError: () => res.sendStatus(500)
            });
        }
    })
});

router.delete("/:id", (req, res) => {
    jwt.verify(req.token,claveSecreta,(error,authData) => {
        if(error){
            /* acceso prohibido */
            res.sendStatus(403);
        }else{
            const onSuccess = biblioteca => 
            biblioteca
                .destroy()
                .then(() => res.sendStatus(200))
                .catch(() => res.sendStatus(500));
            findMateria(req.params.id, {
            onSuccess,
            onNotFound: () => res.sendStatus(404),
            onError: () => res.sendStatus(500)
            });
        }
    }) 
});

module.exports = router;
