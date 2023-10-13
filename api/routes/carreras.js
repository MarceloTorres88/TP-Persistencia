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
  console.log("Obteniendo datos de carreras");
  models.carrera
    .findAll({
      attributes: ["id", "nombre"],
      include:[
        {as:'materias',model:models.materia,attributes:['id','nombre','id_carrera']}
      ]
    })
    .then(carreras => res.send(carreras))
    .catch(() => res.sendStatus(500));
});

router.post("/", (req, res) => {
  models.carrera
    .create({ nombre: req.body.nombre })
    .then(carrera => res.status(201).send({ id: carrera.id }))
    .catch(error => {
      if (error == "SequelizeUniqueConstraintError: Validation error") {
        res.status(400).send('Bad request: existe otra carrera con el mismo nombre')
      }
      else {
        console.log(`Error al intentar insertar carrera en la base de datos: ${error}`)
        res.sendStatus(500)
      }
    });
});

const findCarrera = (id, { onSuccess, onNotFound, onError }) => {
  models.carrera
    .findOne({
      attributes: ["id", "nombre"],
      include:[
        {as:'materias',model:models.materia,attributes:['id','nombre','id_carrera']}
      ],
      where: { id }
    })
    .then(carrera => (carrera ? onSuccess(carrera) : onNotFound()))
    .catch(() => onError());
};

router.get("/:id", (req, res) => {
  findCarrera(req.params.id, {
    onSuccess: carrera => res.send(carrera),
    onNotFound: () => res.sendStatus(404),
    onError: () => res.sendStatus(500)
  });
});

router.put("/:id", (req, res) => {
  jwt.verify(req.token,claveSecreta,(error,authData)=> {
    if (error) {
      /* acceso prohibido/ forbbiden */
      res.sendStatus(403);
    } else {
      const onSuccess = carrera =>
      carrera
      .update({ nombre: req.body.nombre }, { fields: ["nombre"] })
      .then(() => res.sendStatus(200),authData) /* en revision */
      .catch(error => {
        if (error == "SequelizeUniqueConstraintError: Validation error") {
          res.status(400).send('Bad request: existe otra carrera con el mismo nombre')
        }
        else {
          console.log(`Error al intentar actualizar la carrera: ${error}`)
          res.sendStatus(500)
        }
      });
      findCarrera(req.params.id, {
      onSuccess,
      onNotFound: () => res.sendStatus(404),
      onError: () => res.sendStatus(500)
      });
    }
  })
});

router.delete("/:id", (req, res) => {
  jwt.verify(req.token,claveSecreta,(error,authData) =>{
    if (error) {
      /* acceso prohibido / forbbiden */
      res.sendStatus(403);
    } else {
      const onSuccess = carrera =>
      carrera
        .destroy()
        .then(() => res.sendStatus(200))
        .catch(() => res.sendStatus(500));
      findCarrera(req.params.id, {
      onSuccess,
      onNotFound: () => res.sendStatus(404),
      onError: () => res.sendStatus(500)
      });
    }
  })
});

module.exports = router;
