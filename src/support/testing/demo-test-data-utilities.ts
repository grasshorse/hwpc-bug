/**
 * Demo script for test data management utilities
 * 
 * Demonstrates the functionality of the test data management utilities
 * created for task 11.
 */

import { TestDataManager } from './TestDataManager';
import { SnapshotManager } from './SnapshotManager';
import { ProductionDataMaintenance } from './ProductionDataMaintenance';
import { DataIntegrityValidator } from './DataIntegrityValidator';
import { DataVersionManager } from './DataVersionManager';
import { TestMode, TestDataSet, ProductionConfig, DatabaseConfig } from './types';

async function demonstrateTestDataUtilities() {
  console.log('🚀 Test Data Management Utilities Demo\n');

  // Create sample test data
  const sampleTestData: TestDataSet = {
    customers: [
      {
        id: 'cust-001',
        name: 'Bugs Bunny - looneyTunesTest',
        email: 'bugs.bunny@looneytunestest.com',
        phone: '555-0001',
        isTestData: true
      },
      {
        id: 'cust-002',
        name: 'Daffy Duck - looneyTunesTest',
        email: 'daffy.duck@looneytunestest.com',
        phone: '555-0002',
        isTestData: true
      }
    ],
    routes: [
      {
        id: 'route-001',
        name: 'Cedar Falls Test Route - looneyTunesTest',
        location: 'Cedar Falls',
        isTestData: true
      },
      {
        id: 'route-002',
        name: 'Winfield Test Route - looneyTunesTest',
        location: 'Winfield',
        isTestData: true
      }
    ],
    tickets: [
      {
        id: 'ticket-001',
        customerId: 'cust-001',
        routeId: 'route-001',
        status: 'active',
        isTestData: true
      }
    ],
    metadata: {
      createdAt: new Date(),
      mode: TestMode.ISOLATED,
      version: '1.0.0',
      testRunId: 'demo-run-001'
    }
  };

  try {
    // 1. Demonstrate TestDataManager
    console.log('📊 1. TestDataManager Demo');
    console.log('=' .repeat(50));
    
    const testDataManager = new TestDataManager('.kiro/test-data/demo');
    
    // Create a snapshot
    const snapshot = await testDataManager.createSnapshot(
      'demo-snapshot',
      TestMode.ISOLATED,
      sampleTestData,
      { description: 'Demo snapshot for testing utilities' }
    );
    console.log(`✅ Created snapshot: ${snapshot.name} (${snapshot.id})`);
    
    // Validate test data
    const validation = await testDataManager.validateTestData(sampleTestData);
    console.log(`✅ Data validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(`   - Customers: ${validation.validatedEntities.customers}`);
    console.log(`   - Routes: ${validation.validatedEntities.routes}`);
    console.log(`   - Tickets: ${validation.validatedEntities.tickets}`);
    
    // List snapshots
    const snapshots = await testDataManager.listSnapshots();
    console.log(`✅ Found ${snapshots.length} snapshots`);
    
    console.log();

    // 2. Demonstrate SnapshotManager
    console.log('📸 2. SnapshotManager Demo');
    console.log('=' .repeat(50));
    
    const snapshotManager = new SnapshotManager('.kiro/test-data/demo/snapshots');
    const databaseConfig: DatabaseConfig = {
      backupPath: 'demo-backup.sql',
      connectionString: 'postgresql://localhost:5432/demo_db',
      restoreTimeout: 30000,
      verificationQueries: ['SELECT COUNT(*) FROM customers']
    };
    
    // Create database snapshot
    const dbSnapshot = await snapshotManager.createSnapshot(databaseConfig, {
      name: 'demo-db-snapshot',
      description: 'Demo database snapshot',
      format: 'sql'
    });
    console.log(`✅ Created database snapshot: ${dbSnapshot.name} (${dbSnapshot.format})`);
    console.log(`   - Size: ${dbSnapshot.size} bytes`);
    console.log(`   - Tables: ${dbSnapshot.metadata.tables.join(', ')}`);
    
    console.log();

    // 3. Demonstrate ProductionDataMaintenance
    console.log('🔧 3. ProductionDataMaintenance Demo');
    console.log('=' .repeat(50));
    
    const productionConfig: ProductionConfig = {
      testDataPrefix: 'looneyTunesTest',
      locations: ['Cedar Falls', 'Winfield', "O'Fallon"],
      customerNames: ['Bugs Bunny', 'Daffy Duck', 'Porky Pig'],
      cleanupPolicy: 'preserve'
    };
    
    const maintenance = new ProductionDataMaintenance(productionConfig);
    
    // Perform health check
    const healthCheck = await maintenance.performHealthCheck();
    console.log(`✅ Health check: ${healthCheck.isHealthy ? 'HEALTHY' : 'ISSUES FOUND'}`);
    if (healthCheck.recommendations.length > 0) {
      console.log('   Recommendations:');
      healthCheck.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
    
    // Generate maintenance report
    const maintenanceReport = await maintenance.generateMaintenanceReport();
    console.log(`✅ Maintenance report: ${maintenanceReport.summary}`);
    
    console.log();

    // 4. Demonstrate DataIntegrityValidator
    console.log('🔍 4. DataIntegrityValidator Demo');
    console.log('=' .repeat(50));
    
    const validator = new DataIntegrityValidator();
    
    // Validate sample data
    const integrityReport = await validator.validateTestData(sampleTestData);
    console.log(`✅ Integrity validation: ${integrityReport.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(`   - Total entities: ${integrityReport.totalEntities}`);
    console.log(`   - Errors: ${integrityReport.summary.errors}`);
    console.log(`   - Warnings: ${integrityReport.summary.warnings}`);
    
    // Test with invalid data
    const invalidData = {
      ...sampleTestData,
      customers: [
        {
          id: '', // Invalid: empty ID
          name: 'Invalid Customer',
          email: 'invalid-email', // Invalid: bad format
          phone: '555-0001',
          isTestData: true
        }
      ]
    };
    
    const invalidReport = await validator.validateTestData(invalidData);
    console.log(`✅ Invalid data test: ${invalidReport.isValid ? 'PASSED' : 'FAILED (as expected)'}`);
    console.log(`   - Errors found: ${invalidReport.summary.errors}`);
    
    console.log();

    // 5. Demonstrate DataVersionManager
    console.log('🔄 5. DataVersionManager Demo');
    console.log('=' .repeat(50));
    
    const versionManager = new DataVersionManager('.kiro/test-data/demo/versions');
    
    // Check version compatibility
    const compatibility = versionManager.checkCompatibility('1.0.0', '1.1.0');
    console.log(`✅ Version compatibility (1.0.0 -> 1.1.0): ${compatibility.isCompatible ? 'COMPATIBLE' : 'INCOMPATIBLE'}`);
    if (compatibility.recommendations.length > 0) {
      console.log('   Recommendations:');
      compatibility.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
    
    // Create migration plan
    const migrationPlan = versionManager.createMigrationPlan('1.0.0', '1.1.0');
    console.log(`✅ Migration plan: ${migrationPlan.migrations.length} migrations`);
    console.log(`   - Estimated duration: ${migrationPlan.estimatedDuration}s`);
    console.log(`   - Backup required: ${migrationPlan.backupRequired}`);
    
    // Execute migration (dry run)
    const migrationResult = await versionManager.executeMigration(
      sampleTestData,
      migrationPlan,
      { dryRun: true }
    );
    console.log(`✅ Migration dry run: ${migrationResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   - Duration: ${migrationResult.duration}ms`);
    
    console.log();

    // 6. Demonstrate Production Test Data Creation
    console.log('🏭 6. Production Test Data Creation Demo');
    console.log('=' .repeat(50));
    
    const productionTestData = await testDataManager.createProductionTestData(productionConfig);
    console.log(`✅ Created production test data:`);
    console.log(`   - Customers: ${productionTestData.customers.length}`);
    console.log(`   - Routes: ${productionTestData.routes.length}`);
    console.log(`   - Tickets: ${productionTestData.tickets.length}`);
    
    // Show sample customer names
    console.log('   Sample customers:');
    productionTestData.customers.slice(0, 2).forEach(customer => {
      console.log(`   - ${customer.name} (${customer.email})`);
    });
    
    console.log();

    // 7. Demonstrate Cleanup Operations
    console.log('🧹 7. Cleanup Operations Demo');
    console.log('=' .repeat(50));
    
    // Perform dry run cleanup
    await testDataManager.cleanup({ dryRun: true, preserveLatest: 1 });
    console.log('✅ Cleanup dry run completed');
    
    console.log();
    console.log('🎉 Demo completed successfully!');
    console.log('All test data management utilities are working correctly.');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateTestDataUtilities()
    .then(() => {
      console.log('\n✨ Demo finished successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateTestDataUtilities };