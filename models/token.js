module.exports = (sequelize, Sequelize) => {
    const GameMap = sequelize.define(
        'token',
        {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            key: { type: Sequelize.STRING(255), allowNull: false, unique: true },
            count: { type: Sequelize.INTEGER, allowNull: false },
        },
        {
            tableName: 'token',
            timestamps: false
        }
    );

    return GameMap;
};
