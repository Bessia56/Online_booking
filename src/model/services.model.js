const db = require("../config/db");

/**
 * Создаёт новую услугу в базе данных.
 *
 * @param {Object} serviceData - Данные новой услуги.
 * @returns {Promise<Object>} Созданная запись услуги.
 */
async function createService(serviceData) {
    const [service] = await db("services") // [service] - деструктуризация массива
        .insert(serviceData)
        .returning("*");

    return service;
}

/**
 * Получает список всех услуг.
 *
 * @returns {Promise<Object[]>} Массив услуг.
 */
async function listServices() {
    const services = await db("services").select("*");
    return services;
}

/**
 * Получает услугу по ID.
 *
 * @param {number|string} id - Идентификатор услуги.
 * @returns {Promise<Object|undefined>} Найденная услуга или undefined.
 */
async function getServiceById(id) {
    const [service] = await db("services").select("*").where({ id });
    return service;
}

/**
 * Частично обновляет данные услуги.
 *
 * @param {number|string} id - Идентификатор услуги.
 * @param {Object} updateData - Поля, которые необходимо обновить.
 * @returns {Promise<Object|undefined>} Обновлённая услуга или undefined.
 */
async function updateService(id, updateData) {
    const [service] = await db("services").where({ id }).update(updateData).returning("*");
    return service;
}

/**
 * Деактивирует услугу по её ID.
 *
 * Физически запись из базы данных не удаляется.
 *
 * @param {number|string} id - Идентификатор услуги.
 * @returns {Promise<Object|undefined>} Деактивированная услуга или undefined, если запись не найдена.
 */
async function deleteService(id) {
    const [service] = await db("services")
        .where({ id })
        .update({ is_active: false })
        .returning("*");

    return service;
}

/**
 * Проверяет существование и активность услуги.
 *
 * Возвращает запись только в том случае, если услуга существует
 * и имеет is_active = true.
 *
 * @param {number|string} serviceId - Идентификатор услуги.
 * @returns {Promise<Object|undefined>} Запись активной услуги или undefined, если услуга отсутствует или неактивна.
 */
async function isServiceActive(serviceId) {
    return await db("services")
        .where({ id: serviceId, is_active: true })
        .first();
}


module.exports = {
    createService,
    listServices,
    getServiceById,
    updateService,
    deleteService,
    isServiceActive
};