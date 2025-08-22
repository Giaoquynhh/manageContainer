// Test script để kiểm tra State Machine transitions
const { RequestStateMachine } = require('./modules/requests/service/RequestStateMachine');

console.log('=== TESTING STATE MACHINE TRANSITIONS ===\n');

// Test transitions cho Customer roles
const customerRoles = ['CustomerAdmin', 'CustomerUser'];
const depotRoles = ['SaleAdmin', 'SystemAdmin'];

console.log('1. Testing SCHEDULED -> FORWARDED transitions:');
customerRoles.forEach(role => {
  const canTransition = RequestStateMachine.canTransition('SCHEDULED', 'FORWARDED', role);
  console.log(`  ${role}: SCHEDULED -> FORWARDED = ${canTransition}`);
});

console.log('\n2. Testing SCHEDULED_INFO_ADDED -> FORWARDED transitions:');
customerRoles.forEach(role => {
  const canTransition = RequestStateMachine.canTransition('SCHEDULED_INFO_ADDED', 'FORWARDED', role);
  console.log(`  ${role}: SCHEDULED_INFO_ADDED -> FORWARDED = ${canTransition}`);
});

console.log('\n3. Testing Depot role transitions:');
depotRoles.forEach(role => {
  const canTransition = RequestStateMachine.canTransition('SCHEDULED', 'FORWARDED', role);
  console.log(`  ${role}: SCHEDULED -> FORWARDED = ${canTransition}`);
});

console.log('\n4. Testing valid transitions for CustomerAdmin:');
const validTransitions = RequestStateMachine.getValidTransitions('SCHEDULED', 'CustomerAdmin');
console.log('  Valid transitions from SCHEDULED for CustomerAdmin:');
validTransitions.forEach(t => {
  console.log(`    -> ${t.to}: ${t.description}`);
});

console.log('\n5. Testing valid transitions for CustomerUser:');
const validTransitionsUser = RequestStateMachine.getValidTransitions('SCHEDULED', 'CustomerUser');
console.log('  Valid transitions from SCHEDULED for CustomerUser:');
validTransitionsUser.forEach(t => {
  console.log(`    -> ${t.to}: ${t.description}`);
});

console.log('\n=== END TEST ===');
