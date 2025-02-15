module.exports = (sequelize, Sequelize) => {
    const Users = sequelize.define(
        'Users',
        {
            uid: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            userName: { type: Sequelize.STRING(50), allowNull: false },
            isBanned: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            hwid: { type: Sequelize.STRING(255), allowNull: false },
            token: { type: Sequelize.STRING(255), allowNull: false },
            userKey: { type: Sequelize.STRING(255), allowNull: true },
            discordId: { type: Sequelize.STRING(255), allowNull: false, unique: true }
        },
        {
            tableName: 'users',
            timestamps: false
        }
    );

    return Users; 
};
