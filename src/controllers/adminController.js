const db = require('../config/db');
const supabaseAdmin = require('../config/supabaseAdmin');
const { sendResetEmail } = require('../services/emailService');

const getStats = async (req, res) => {
  try {
    const total = await db('profiles').count('id as count').first();
    const active = await db('profiles')
      .where('last_seen', '>=', db.raw("NOW() - INTERVAL '30 days'"))
      .count('id as count')
      .first();

    const rolesRaw = await db('profiles')
      .select(db.raw('LOWER(role) as role'))
      .count('id as count')
      .groupByRaw('LOWER(role)');

    res.json({
      total: parseInt(total.count),
      active: active ? parseInt(active.count) : 0,
      roles: rolesRaw.map(r => ({
        role: r.role,
        count: parseInt(r.count)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await db('profiles')
      .select('id', 'rut', 'first_names', 'last_names', 'email', 'role', 'status', 'delete_requested_at')
      .orderBy('created_at', 'desc');

    const normalizedUsers = users.map(u => ({
      ...u,
      role: u.role ? u.role.toLowerCase() : 'user'
    }));

    res.json(normalizedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
};

const sendResetLink = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await db('profiles')
      .whereRaw('LOWER(email) = ?', [email.toLowerCase()])
      .first();

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const fullName = `${user.first_names} ${user.last_names}`;
    await sendResetEmail(user.email, fullName);
    
    res.json({ message: 'Correo enviado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al enviar correo' });
  }
};

const updatePasswordAuth = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const userAuth = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!userAuth) return res.status(404).json({ error: 'Usuario no encontrado en Auth' });

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userAuth.id,
      { password: newPassword }
    );
    if (updateError) throw updateError;

    res.json({ success: true, message: 'Contraseña actualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Fallo al actualizar contraseña' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.transaction(async (trx) => {
      const user = await trx('profiles').where({ id }).first();
      if (!user) throw new Error('Usuario no existe');
      
      if (!user.delete_requested_at) {
        throw new Error('Solo se pueden eliminar usuarios con solicitud pendiente');
      }

      await trx('medical_records').where({ user_id: id }).del();
      await trx('sos_events').where({ user_id: id }).del();
      await trx('ia_chat_history').where({ user_id: id }).del();
      await trx('biometrics_history').where({ user_id: id }).del();
      await trx('profiles').where({ id }).del();
      await supabaseAdmin.auth.admin.deleteUser(id);
    });

    res.json({ message: 'Usuario y registros eliminados permanentemente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const verifyAdmin = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ isAdmin: false });

  try {
    const user = await db('profiles')
      .select('role')
      .whereRaw('LOWER(email) = ?', [email.toLowerCase()]) 
      .first();

    const isAdmin = user && user.role && user.role.toLowerCase() === 'admin';
    return res.json({ isAdmin: !!isAdmin });
  } catch (error) {
    res.status(500).json({ error: 'Error verificando rol' });
  }
};

const requestAccountDeletion = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db('profiles').where({ id }).first();
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    await db('profiles')
      .where({ id })
      .update({
        status: 'delete_requested',
        delete_requested_at: db.fn.now()
      });

    res.json({ success: true, message: 'Solicitud recibida' });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar solicitud' });
  }
};

const createSpecialist = async (req, res) => {
  const { email, password, first_names, last_names, rut } = req.body;
  let authUser = null;

  try {
    const existingRut = await db('profiles').where({ rut }).first();
    if (existingRut) {
      return res.status(400).json({ error: 'Este RUT ya está registrado en el sistema.' });
    }

    const existingEmail = await db('profiles')
      .whereRaw('LOWER(email) = ?', [email.toLowerCase()])
      .first();
    if (existingEmail) {
      return res.status(400).json({ error: 'Este correo ya está registrado por otro usuario.' });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { 
        first_names, 
        last_names, 
        rut, 
        role: 'specialist',
        status: 'active'
      }
    });

    if (authError) {
       if (authError.message.includes("already been registered") || authError.message.includes("already has been registered")) {
         throw new Error("El correo ya está registrado en el sistema de autenticación.");
       }
       throw authError;
    }

    authUser = authData.user;
    const userId = authData.user.id;

    await db('profiles')
      .insert({
        id: userId,
        email,
        rut,
        first_names,
        last_names,
        role: 'specialist',
        status: 'active'
      })
      .onConflict('id')
      .merge();

    res.status(201).json({ message: 'Especialista creado exitosamente', id: userId });

  } catch (error) {
    if (authUser && error.code !== 'auth_error') {
        await supabaseAdmin.auth.admin.deleteUser(authUser.id).catch(() => {});
    }
    res.status(400).json({ error: error.message || 'Error al crear especialista' });
  }
};

module.exports = { 
  getStats, 
  getUsers, 
  sendResetLink, 
  updatePasswordAuth, 
  deleteUser,
  verifyAdmin,
  requestAccountDeletion,
  createSpecialist
};