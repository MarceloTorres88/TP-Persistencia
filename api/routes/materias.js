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
        console.log("error 403 del verificar");
        res.sendStatus(403);
    }
}

router.get("/", (req, res) => {
    console.log("Obteniendo datos de materias");
    models.materia
    .findAll({
        attributes: ["id", "nombre", "id_carrera"],
        include:[
            {as:'carrera_relacionada',model:models.carrera,attributes:['id','nombre']},
            {as:'profesor_relacionada',model:models.profesor,attributes:['id','nombre','apellido','edad']},  
            {as:'horario_relacionada',model:models.horario,attributes:['id','dia','inicio','fin']}
        ]
    })
    .then(materias => res.send(materias))
    .catch(() => res.sendStatus(500));
});

router.post("/",verificar, (req, res) => {
    jwt.verify(req.token,claveSecreta,(error,authData) =>{
        if(error){
            console.log(error);
            res.sendStatus(403);
        }else{
            models.materia
            .create({ nombre: req.body.nombre,id_carrera: req.body.id_carrera })
            .then(materia => res.status(201).send({ id: materia.id,authData }))
            .catch(error => {
                if (error == "SequelizeUniqueConstraintError: Validation error") {
                    res.status(400).send('Bad request: existe otra materia con el mismo nombre')
                }
                else {
                    console.log(`Error al intentar insertar materia en la base de datos: ${error}`)
                    res.sendStatus(500)
                }
            });
        }
    })
});

const findMateria = (id, { onSuccess, onNotFound, onError }) => {
    models.materia
        .findOne({
            attributes: ["id", "nombre", "id_carrera"],
            include: [
                {as:'carrera_relacionada',model:models.carrera,attributes:['id','nombre']},
                {as:'profesor_relacionada',model:models.profesor,attributes:['id','nombre','apellido','edad']},
                {as:'horario_relacionada',model:models.horario,attributes:['id','dia','inicio','fin']}
            ],
            where: { id }
        })
        .then(materia => (materia ? onSuccess(materia) : onNotFound()))
        .catch(() => onError());
};

router.get("/:id", (req, res) => {
    findMateria(req.params.id, {
        onSuccess: materia => res.send(materia),
        onNotFound: () => res.sendStatus(404),
        onError: () => res.sendStatus(500)
    });
});

router.put("/:id",verificar, (req, res) => {
    jwt.verify(req.token,claveSecreta,(error,authData)=> {
        if(error){
            /* acceso prohibido/ forbbiden */
            console.log(error);
            res.sendStatus(403);
        }else{
            const onSuccess = materia =>
            materia
            .update({ nombre: req.body.nombre, id_carrera: req.body.id_carrera }, { fields: ["nombre","id_carrera"] })
            .then(() => res.sendStatus(200),authData) /* en revision */
            .catch(error => {
                if (error == "SequelizeUniqueConstraintError: Validation error") {
                    res.status(400).send('Bad request: existe otra materia con el mismo nombre')
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

router.delete("/:id",verificar, (req, res) => {
    jwt.verify(req.token,claveSecreta,(error,authData) =>{
        if(error){
            /* acceso prohibido / forbbiden */
            console.log(error);
            res.sendStatus(403);
        }else{
            const onSuccess = materia => 
            materia
                .destroy()
                .then(() => res.sendStatus(200),authData) /* en revision */
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
