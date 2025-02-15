module.exports = (sequelize, Sequelize) => {
    const GameMap = sequelize.define(
        'GameMap',
        {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            key: { type: Sequelize.STRING(50), allowNull: false, unique: true },
            gameName: { type: Sequelize.STRING(50), allowNull: false },
            isactive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        },
        {
            tableName: 'game_maps',
            timestamps: false
        }
    );

    return GameMap;
};
