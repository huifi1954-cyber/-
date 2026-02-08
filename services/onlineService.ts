/**
 * Online Data Service using Gun.js
 * Optimized for multi-device private rooms.
 */

declare var Gun: any;

const peers = [
  'https://gun-manhattan.herokuapp.com/gun',
  'https://relay.peer.ooo/gun'
];

const getGun = () => {
    if (typeof window !== 'undefined' && typeof Gun !== 'undefined') {
        return Gun({ peers, localStorage: true, retry: 1000 });
    }
    return null;
};

const gunInstance = getGun();

// Return a specific node based on the school code
const getSchoolNode = (code: string) => {
  const sanitizedCode = (code || 'default').toLowerCase().trim();
  return gunInstance?.get('houaifi-v5').get(sanitizedCode);
};

export const OnlineService = {
  saveRecord: (schoolCode: string, record: any) => {
    const node = getSchoolNode(schoolCode);
    if (!node) return;
    node.get('records').get(record.id).put(record);
  },

  deleteRecord: (schoolCode: string, id: string) => {
    const node = getSchoolNode(schoolCode);
    if (!node) return;
    node.get('records').get(id).put(null);
  },

  subscribeToRecords: (schoolCode: string, callback: (records: any[]) => void) => {
    const node = getSchoolNode(schoolCode);
    if (!node) return;
    
    node.get('records').map().on((data: any, id: string) => {
      if (data === null) {
        callback([{ id, _deleted: true }]);
      } else if (data && data.studentName) {
        callback([{ ...data, id }]);
      }
    });
  },

  syncUser: (user: any) => {
    const node = getSchoolNode(user.schoolCode);
    if (!node) return;
    node.get('users').get(user.email).put({
      id: user.id,
      name: user.name,
      role: user.role,
      password: user.password,
      email: user.email,
      schoolCode: user.schoolCode
    });
  },

  findUser: (schoolCode: string, email: string, callback: (user: any) => void) => {
    const node = getSchoolNode(schoolCode);
    if (!node) return callback(null);
    node.get('users').get(email).once((user: any) => {
      if (user && user.email) callback(user);
      else callback(null);
    });
  }
};