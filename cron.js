const { Sequelize, QueryTypes } = require('sequelize');
require('dotenv').config();
let db = new Sequelize(`mysql://digiprex:${process.env.dbPassword}@digiprexapi.ctky9owxz1tq.ap-south-1.rds.amazonaws.com:3306/gkc_husky_dev`);
exports.func = async () => {
    try {         
        let orderUpdateQueryResult = await db.query(`select ou.id from gkc_husky_dev.order as o left outer join order_update as ou on ou.order_id = o.id
            and ou.order_status_id in(1) and ou.is_latest=1 where o.is_deleted=0 and ou.is_deleted=0 
            and ou.created_at <= DATE_SUB(NOW(), INTERVAL ${process.env.hour_delay} HOUR);`,
                    { type: QueryTypes.SELECT });
        if(orderUpdateQueryResult.length){
        let orderUpdateId = Array.prototype.map.call(orderUpdateQueryResult, function (item) { return item.id; }).join(",");
        await db.query(` CREATE table temporary_table AS SELECT * FROM order_update WHERE id in(${orderUpdateId});`,
            { type: QueryTypes.CREATE });
        await db.query(`SET SQL_SAFE_UPDATES = 0;`);
        await db.query(` UPDATE temporary_table SET order_status_id = 4, is_latest=1, created_at = now(), updated_at = now();`,
            { type: QueryTypes.UPDATE });
        await db.query(` UPDATE order_update SET is_latest=0 where id in(${orderUpdateId})`,
            { type: QueryTypes.UPDATE });
        await db.query(`UPDATE temporary_table SET id = NULL;`,
            { type: QueryTypes.UPDATE });
        await db.query(`INSERT INTO order_update SELECT * FROM temporary_table;`,
            { type: QueryTypes.INSERT });
        await db.query(`DROP TABLE temporary_table;`,
            { type: QueryTypes.DROP });
        await db.close()
        }

    } catch (error) {
        console.error(error);
    }
}
this.func();
