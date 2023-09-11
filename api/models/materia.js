'use strict';
module.exports = (sequelize, DataTypes) => {
    const materia = sequelize.define('materia', {
        nombre: DataTypes.STRING,
        ID_carrera: DataTypes.INTEGER
    }, {});

    return materia;
};