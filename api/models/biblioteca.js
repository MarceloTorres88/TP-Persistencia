'use strict';
module.exports = (sequelize, DataTypes) => {
    const biblioteca = sequelize.define('biblioteca', {
        autor: DataTypes.STRING,
        titulo: DataTypes.STRING,
        fecha: DataTypes.DATE
    }, {});

    biblioteca.associate = function(models) {
        /* biblioteca pertenece a un docente*/
        biblioteca.hasMany(models.profesor,{
            as: 'profesor_relacionada',
            foreignKey:'id_biblioteca'
        })
    };

    return biblioteca;
};