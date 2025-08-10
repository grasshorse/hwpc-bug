/**
 * HWPC Test Data Templates - Comprehensive test data for tickets, customers, and routes
 * Provides realistic test data generation for comprehensive testing scenarios
 */

// ===== INTERFACE DEFINITIONS =====

export interface AddressData {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
}

export interface ContactData {
    name: string;
    phone: string;
    email: string;
    title?: string;
    isPrimary?: boolean;
}

export interface ServiceHistoryData {
    id: string;
    date: Date;
    serviceType: string;
    technician: string;
    status: 'completed' | 'cancelled' | 'rescheduled';
    notes?: string;
    cost?: number;
}

export interface TicketTestData {
    id?: string;
    customerId: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'scheduled';
    serviceType: string;
    category: string;
    scheduledDate: Date;
    estimatedDuration: number; // in minutes
    actualDuration?: number;
    specialInstructions?: string;
    routeId?: string;
    technicianId?: string;
    createdBy: string;
    createdAt?: Date;
    updatedAt?: Date;
    completedAt?: Date;
    tags?: string[];
    attachments?: string[];
    comments?: CommentData[];
    cost?: number;
    recurring?: boolean;
    recurringFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'annually';
}

export interface CustomerTestData {
    id?: string;
    companyName: string;
    contactName: string;
    contacts: ContactData[];
    address: AddressData;
    billingAddress?: AddressData;
    phone: string;
    email: string;
    serviceTypes: string[];
    preferredTechnician?: string;
    specialInstructions?: string;
    serviceHistory?: ServiceHistoryData[];
    accountStatus: 'active' | 'inactive' | 'suspended';
    paymentTerms: string;
    contractType: 'one-time' | 'monthly' | 'annual';
    createdAt?: Date;
    updatedAt?: Date;
    lastServiceDate?: Date;
    totalRevenue?: number;
    notes?: string[];
    tags?: string[];
    riskLevel?: 'low' | 'medium' | 'high';
    communicationPreference: 'email' | 'phone' | 'text' | 'app';
}

export interface RouteTestData {
    id?: string;
    name: string;
    date: Date;
    technicianId: string;
    technicianName: string;
    status: 'draft' | 'active' | 'completed' | 'cancelled';
    tickets: string[];
    estimatedDuration: number; // in minutes
    actualDuration?: number;
    startLocation: AddressData;
    endLocation: AddressData;
    optimized: boolean;
    notes?: string;
    mileage?: number;
    fuelCost?: number;
    createdAt?: Date;
    updatedAt?: Date;
    completedAt?: Date;
    vehicleId?: string;
    emergencyContact?: ContactData;
}

export interface CommentData {
    id: string;
    ticketId: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: Date;
    isInternal: boolean;
}

export interface TechnicianData {
    id: string;
    name: string;
    email: string;
    phone: string;
    specialties: string[];
    certifications: string[];
    status: 'active' | 'inactive' | 'on_leave';
    vehicleId?: string;
    territory?: string;
    rating?: number;
}

// ===== TEST DATA TEMPLATES =====

export default class TestData {
    
    // ===== TICKET TEST DATA TEMPLATES =====
    
    static readonly TICKET_TEMPLATES = {
        BASIC_PEST_CONTROL: {
            title: "Regular Pest Control Service",
            description: "Monthly pest control treatment for residential property",
            priority: 'medium' as const,
            status: 'open' as const,
            serviceType: "Pest Control",
            category: "Routine Service",
            estimatedDuration: 60,
            specialInstructions: "Customer has pets - use pet-safe products only"
        },
        URGENT_TERMITE: {
            title: "Urgent Termite Inspection",
            description: "Customer reports visible termite damage in basement",
            priority: 'urgent' as const,
            status: 'open' as const,
            serviceType: "Termite Control",
            category: "Emergency Service",
            estimatedDuration: 120,
            specialInstructions: "Bring inspection equipment and treatment supplies"
        },
        RODENT_CONTROL: {
            title: "Rodent Control Treatment",
            description: "Mouse infestation in kitchen and pantry areas",
            priority: 'high' as const,
            status: 'assigned' as const,
            serviceType: "Rodent Control",
            category: "Treatment",
            estimatedDuration: 90,
            specialInstructions: "Focus on entry points and nesting areas"
        },
        PREVENTIVE_TREATMENT: {
            title: "Quarterly Preventive Treatment",
            description: "Seasonal preventive pest control treatment",
            priority: 'low' as const,
            status: 'scheduled' as const,
            serviceType: "Preventive Treatment",
            category: "Maintenance",
            estimatedDuration: 45,
            recurring: true,
            recurringFrequency: 'quarterly' as const
        },
        COMMERCIAL_SERVICE: {
            title: "Commercial Kitchen Pest Control",
            description: "Monthly pest control for restaurant kitchen",
            priority: 'medium' as const,
            status: 'in_progress' as const,
            serviceType: "Commercial Pest Control",
            category: "Commercial Service",
            estimatedDuration: 120,
            specialInstructions: "Service during off-hours only, follow food safety protocols"
        }
    };
    
    // ===== CUSTOMER TEST DATA TEMPLATES =====
    
    static readonly CUSTOMER_TEMPLATES = {
        RESIDENTIAL_BASIC: {
            companyName: "Johnson Residence",
            contactName: "Sarah Johnson",
            phone: "(555) 123-4567",
            email: "sarah.johnson@email.com",
            serviceTypes: ["Pest Control", "Termite Control"],
            accountStatus: 'active' as const,
            paymentTerms: "Net 30",
            contractType: 'monthly' as const,
            communicationPreference: 'email' as const,
            riskLevel: 'low' as const
        },
        COMMERCIAL_RESTAURANT: {
            companyName: "Mario's Italian Restaurant",
            contactName: "Mario Rossi",
            phone: "(555) 987-6543",
            email: "mario@mariositalian.com",
            serviceTypes: ["Commercial Pest Control", "Rodent Control", "Fly Control"],
            accountStatus: 'active' as const,
            paymentTerms: "Net 15",
            contractType: 'monthly' as const,
            communicationPreference: 'phone' as const,
            riskLevel: 'medium' as const,
            specialInstructions: "Service during closed hours only (2 AM - 6 AM)"
        },
        PROPERTY_MANAGEMENT: {
            companyName: "Sunset Property Management",
            contactName: "Jennifer Chen",
            phone: "(555) 456-7890",
            email: "j.chen@sunsetpm.com",
            serviceTypes: ["Pest Control", "Termite Control", "Bed Bug Treatment"],
            accountStatus: 'active' as const,
            paymentTerms: "Net 45",
            contractType: 'annual' as const,
            communicationPreference: 'app' as const,
            riskLevel: 'low' as const,
            specialInstructions: "Multiple properties - coordinate with individual tenants"
        },
        HIGH_RISK_CUSTOMER: {
            companyName: "Downtown Warehouse LLC",
            contactName: "Bob Thompson",
            phone: "(555) 321-0987",
            email: "bthompson@dtwarehouse.com",
            serviceTypes: ["Rodent Control", "Bird Control", "Insect Control"],
            accountStatus: 'active' as const,
            paymentTerms: "COD",
            contractType: 'one-time' as const,
            communicationPreference: 'phone' as const,
            riskLevel: 'high' as const,
            specialInstructions: "Payment required before service, safety equipment mandatory"
        },
        INACTIVE_CUSTOMER: {
            companyName: "Old Town Bakery",
            contactName: "Helen Martinez",
            phone: "(555) 654-3210",
            email: "helen@oldtownbakery.com",
            serviceTypes: ["Commercial Pest Control"],
            accountStatus: 'inactive' as const,
            paymentTerms: "Net 30",
            contractType: 'monthly' as const,
            communicationPreference: 'email' as const,
            riskLevel: 'low' as const,
            specialInstructions: "Former customer - may be interested in reactivation"
        }
    };
    
    // ===== ROUTE TEST DATA TEMPLATES =====
    
    static readonly ROUTE_TEMPLATES = {
        MORNING_RESIDENTIAL: {
            name: "Morning Residential Route",
            status: 'active' as const,
            estimatedDuration: 480, // 8 hours
            optimized: true,
            notes: "Focus on residential properties in suburban area"
        },
        AFTERNOON_COMMERCIAL: {
            name: "Afternoon Commercial Route",
            status: 'active' as const,
            estimatedDuration: 360, // 6 hours
            optimized: true,
            notes: "Commercial properties - coordinate with business hours"
        },
        EMERGENCY_ROUTE: {
            name: "Emergency Response Route",
            status: 'active' as const,
            estimatedDuration: 240, // 4 hours
            optimized: false,
            notes: "High priority emergency calls only"
        },
        WEEKEND_ROUTE: {
            name: "Weekend Maintenance Route",
            status: 'draft' as const,
            estimatedDuration: 300, // 5 hours
            optimized: false,
            notes: "Weekend preventive maintenance and follow-ups"
        }
    };
    
    // ===== ADDRESS TEMPLATES =====
    
    static readonly ADDRESS_TEMPLATES = {
        RESIDENTIAL_SUBURBAN: {
            street: "123 Maple Street",
            city: "Springfield",
            state: "IL",
            zipCode: "62701",
            country: "USA",
            coordinates: { latitude: 39.7817, longitude: -89.6501 }
        },
        COMMERCIAL_DOWNTOWN: {
            street: "456 Business Plaza, Suite 200",
            city: "Springfield",
            state: "IL",
            zipCode: "62702",
            country: "USA",
            coordinates: { latitude: 39.7990, longitude: -89.6440 }
        },
        INDUSTRIAL_AREA: {
            street: "789 Industrial Drive",
            city: "Springfield",
            state: "IL",
            zipCode: "62703",
            country: "USA",
            coordinates: { latitude: 39.7500, longitude: -89.6800 }
        },
        RURAL_PROPERTY: {
            street: "1234 Country Road 15",
            city: "Chatham",
            state: "IL",
            zipCode: "62629",
            country: "USA",
            coordinates: { latitude: 39.6731, longitude: -89.6934 }
        }
    };
    
    // ===== TECHNICIAN TEMPLATES =====
    
    static readonly TECHNICIAN_TEMPLATES = {
        SENIOR_TECH: {
            name: "John Smith",
            email: "j.smith@hwpc.com",
            phone: "(555) 111-2222",
            specialties: ["Termite Control", "Rodent Control", "Commercial Services"],
            certifications: ["Licensed Pest Control Operator", "Termite Specialist"],
            status: 'active' as const,
            territory: "North District",
            rating: 4.8
        },
        JUNIOR_TECH: {
            name: "Emily Davis",
            email: "e.davis@hwpc.com",
            phone: "(555) 333-4444",
            specialties: ["General Pest Control", "Preventive Treatment"],
            certifications: ["Pest Control Technician"],
            status: 'active' as const,
            territory: "South District",
            rating: 4.2
        },
        SPECIALIST_TECH: {
            name: "Michael Rodriguez",
            email: "m.rodriguez@hwpc.com",
            phone: "(555) 555-6666",
            specialties: ["Bed Bug Treatment", "Wildlife Control", "Fumigation"],
            certifications: ["Licensed Pest Control Operator", "Fumigation Specialist", "Wildlife Control"],
            status: 'active' as const,
            territory: "Central District",
            rating: 4.9
        }
    };
    
    // ===== SERVICE TYPE DEFINITIONS =====
    
    static readonly SERVICE_TYPES = [
        "General Pest Control",
        "Termite Control",
        "Rodent Control",
        "Bed Bug Treatment",
        "Ant Control",
        "Cockroach Control",
        "Spider Control",
        "Wasp/Bee Control",
        "Fly Control",
        "Mosquito Control",
        "Wildlife Control",
        "Bird Control",
        "Commercial Pest Control",
        "Preventive Treatment",
        "Emergency Service",
        "Fumigation",
        "Inspection Service"
    ];
    
    // ===== PRIORITY LEVELS =====
    
    static readonly PRIORITY_LEVELS = ['low', 'medium', 'high', 'urgent'] as const;
    
    // ===== STATUS OPTIONS =====
    
    static readonly TICKET_STATUSES = ['open', 'assigned', 'in_progress', 'completed', 'cancelled', 'scheduled'] as const;
    static readonly CUSTOMER_STATUSES = ['active', 'inactive', 'suspended'] as const;
    static readonly ROUTE_STATUSES = ['draft', 'active', 'completed', 'cancelled'] as const;
    
    // ===== UTILITY METHODS FOR TEST DATA GENERATION =====
    
    /**
     * Generate a random ticket ID
     */
    static generateTicketId(): string {
        return `TKT-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }
    
    /**
     * Generate a random customer ID
     */
    static generateCustomerId(): string {
        return `CUST-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }
    
    /**
     * Generate a random route ID
     */
    static generateRouteId(): string {
        return `ROUTE-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }
    
    /**
     * Generate a random technician ID
     */
    static generateTechnicianId(): string {
        return `TECH-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }
    
    /**
     * Generate a random date within a specified range
     */
    static generateRandomDate(startDate: Date, endDate: Date): Date {
        const start = startDate.getTime();
        const end = endDate.getTime();
        return new Date(start + Math.random() * (end - start));
    }
    
    /**
     * Generate a random phone number
     */
    static generatePhoneNumber(): string {
        const areaCode = Math.floor(Math.random() * 800) + 200;
        const exchange = Math.floor(Math.random() * 800) + 200;
        const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `(${areaCode}) ${exchange}-${number}`;
    }
    
    /**
     * Generate a random email address
     */
    static generateEmail(name: string, domain: string = 'example.com'): string {
        const cleanName = name.toLowerCase().replace(/\s+/g, '.');
        return `${cleanName}@${domain}`;
    }
    
    /**
     * Get a random item from an array
     */
    static getRandomItem<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    /**
     * Get multiple random items from an array
     */
    static getRandomItems<T>(array: T[], count: number): T[] {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, array.length));
    }
    
    /**
     * Generate realistic test data for mobile testing scenarios
     */
    static generateMobileTestScenarios() {
        return {
            QUICK_TICKET_CREATION: {
                scenario: "Mobile technician creates urgent ticket on-site",
                data: {
                    ...this.TICKET_TEMPLATES.URGENT_TERMITE,
                    createdVia: "mobile_app",
                    location: "on_site",
                    attachments: ["photo_damage.jpg", "location_map.png"]
                }
            },
            OFFLINE_ROUTE_UPDATE: {
                scenario: "Technician updates route status while offline",
                data: {
                    ...this.ROUTE_TEMPLATES.MORNING_RESIDENTIAL,
                    offlineUpdates: true,
                    syncRequired: true,
                    lastSyncTime: new Date(Date.now() - 3600000) // 1 hour ago
                }
            },
            CUSTOMER_LOOKUP_GPS: {
                scenario: "Find customer using GPS location",
                data: {
                    ...this.CUSTOMER_TEMPLATES.RESIDENTIAL_BASIC,
                    gpsEnabled: true,
                    locationAccuracy: "high",
                    distanceFromTechnician: 0.5 // miles
                }
            }
        };
    }
    
    /**
     * Generate test data for performance testing
     */
    static generatePerformanceTestData(recordCount: number) {
        const tickets: Partial<TicketTestData>[] = [];
        const customers: Partial<CustomerTestData>[] = [];
        const routes: Partial<RouteTestData>[] = [];
        
        for (let i = 0; i < recordCount; i++) {
            tickets.push({
                id: this.generateTicketId(),
                ...this.getRandomItem(Object.values(this.TICKET_TEMPLATES)),
                customerId: this.generateCustomerId(),
                createdBy: this.generateTechnicianId(),
                createdAt: this.generateRandomDate(
                    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                    new Date()
                )
            });
            
            if (i < recordCount / 2) { // Generate fewer customers than tickets
                customers.push({
                    id: this.generateCustomerId(),
                    ...this.getRandomItem(Object.values(this.CUSTOMER_TEMPLATES)),
                    createdAt: this.generateRandomDate(
                        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
                        new Date()
                    )
                });
            }
            
            if (i < recordCount / 10) { // Generate fewer routes
                routes.push({
                    id: this.generateRouteId(),
                    ...this.getRandomItem(Object.values(this.ROUTE_TEMPLATES)),
                    technicianId: this.generateTechnicianId(),
                    technicianName: this.getRandomItem(Object.values(this.TECHNICIAN_TEMPLATES)).name,
                    date: this.generateRandomDate(
                        new Date(),
                        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
                    )
                });
            }
        }
        
        return { tickets, customers, routes };
    }
    
    /**
     * Generate test data for error scenarios
     */
    static generateErrorScenarioData() {
        return {
            INVALID_TICKET: {
                id: "INVALID-ID",
                customerId: "", // Empty customer ID
                title: "", // Empty title
                priority: 'invalid' as any, // Invalid priority
                status: 'unknown' as any, // Invalid status
                estimatedDuration: -1 // Negative duration
            },
            MALFORMED_CUSTOMER: {
                id: "MALFORMED",
                companyName: "A".repeat(1000), // Extremely long name
                email: "invalid-email", // Invalid email format
                phone: "123", // Invalid phone format
                serviceTypes: [], // Empty service types
                accountStatus: 'deleted' as any // Invalid status
            },
            CONFLICTING_ROUTE: {
                id: "CONFLICT",
                name: "Conflicting Route",
                date: new Date("invalid-date"), // Invalid date
                technicianId: "NON-EXISTENT", // Non-existent technician
                tickets: ["FAKE-1", "FAKE-2"], // Non-existent tickets
                estimatedDuration: 0 // Zero duration
            }
        };
    }
    
    /**
     * Generate comprehensive test data factory for all entities
     * @param options - Configuration options for data generation
     * @returns Complete test data set
     */
    static generateComprehensiveTestDataSet(options: {
        ticketCount?: number;
        customerCount?: number;
        routeCount?: number;
        technicianCount?: number;
        includeRelationships?: boolean;
        includeHistoricalData?: boolean;
    } = {}) {
        const {
            ticketCount = 10,
            customerCount = 5,
            routeCount = 3,
            technicianCount = 3,
            includeRelationships = true,
            includeHistoricalData = false
        } = options;
        
        // Generate base entities
        const technicians = Array.from({ length: technicianCount }, (_, i) => ({
            id: this.generateTechnicianId(),
            ...this.getRandomItem(Object.values(this.TECHNICIAN_TEMPLATES)),
            name: `Technician ${i + 1}`
        }));
        
        const customers = Array.from({ length: customerCount }, (_, i) => ({
            id: this.generateCustomerId(),
            ...this.getRandomItem(Object.values(this.CUSTOMER_TEMPLATES)),
            companyName: `Customer Company ${i + 1}`,
            address: this.getRandomItem(Object.values(this.ADDRESS_TEMPLATES)),
            contacts: [{
                name: `Contact Person ${i + 1}`,
                phone: this.generatePhoneNumber(),
                email: this.generateEmail(`contact${i + 1}`),
                isPrimary: true
            }]
        }));
        
        const tickets = Array.from({ length: ticketCount }, (_, i) => ({
            id: this.generateTicketId(),
            ...this.getRandomItem(Object.values(this.TICKET_TEMPLATES)),
            title: `Ticket ${i + 1}: ${this.getRandomItem(Object.values(this.TICKET_TEMPLATES)).title}`,
            customerId: includeRelationships ? this.getRandomItem(customers).id! : this.generateCustomerId(),
            createdBy: includeRelationships ? this.getRandomItem(technicians).id : this.generateTechnicianId(),
            scheduledDate: this.generateRandomDate(
                new Date(),
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
            ),
            createdAt: this.generateRandomDate(
                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                new Date()
            )
        }));
        
        const routes = Array.from({ length: routeCount }, (_, i) => ({
            id: this.generateRouteId(),
            ...this.getRandomItem(Object.values(this.ROUTE_TEMPLATES)),
            name: `Route ${i + 1}`,
            technicianId: includeRelationships ? this.getRandomItem(technicians).id : this.generateTechnicianId(),
            technicianName: includeRelationships ? this.getRandomItem(technicians).name : `Technician ${i + 1}`,
            date: this.generateRandomDate(
                new Date(),
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
            ),
            tickets: includeRelationships ? 
                this.getRandomItems(tickets.map(t => t.id!), Math.floor(Math.random() * 5) + 1) : 
                [],
            startLocation: this.getRandomItem(Object.values(this.ADDRESS_TEMPLATES)),
            endLocation: this.getRandomItem(Object.values(this.ADDRESS_TEMPLATES))
        }));
        
        // Add historical data if requested
        let serviceHistory: ServiceHistoryData[] = [];
        if (includeHistoricalData) {
            serviceHistory = Array.from({ length: customerCount * 3 }, (_, i) => ({
                id: `HIST-${Date.now()}-${i}`,
                date: this.generateRandomDate(
                    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
                    new Date()
                ),
                serviceType: this.getRandomItem(this.SERVICE_TYPES),
                technician: this.getRandomItem(technicians).name,
                status: this.getRandomItem(['completed', 'cancelled', 'rescheduled']),
                notes: `Historical service record ${i + 1}`,
                cost: Math.floor(Math.random() * 500) + 50
            }));
        }
        
        return {
            tickets,
            customers,
            routes,
            technicians,
            serviceHistory,
            metadata: {
                generatedAt: new Date(),
                totalRecords: tickets.length + customers.length + routes.length + technicians.length,
                includeRelationships,
                includeHistoricalData
            }
        };
    }
    
    /**
     * Generate test data for specific business scenarios
     * @param scenario - Business scenario name
     * @returns Scenario-specific test data
     */
    static generateBusinessScenarioData(scenario: string) {
        switch (scenario.toLowerCase()) {
            case 'emergency_response':
                return {
                    ticket: {
                        ...this.TICKET_TEMPLATES.URGENT_TERMITE,
                        id: this.generateTicketId(),
                        customerId: this.generateCustomerId(),
                        createdBy: this.generateTechnicianId(),
                        createdAt: new Date(),
                        scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
                        tags: ['emergency', 'urgent', 'same-day']
                    },
                    customer: {
                        ...this.CUSTOMER_TEMPLATES.RESIDENTIAL_BASIC,
                        id: this.generateCustomerId(),
                        communicationPreference: 'phone' as const,
                        riskLevel: 'high' as const
                    }
                };
                
            case 'route_optimization':
                return {
                    route: {
                        ...this.ROUTE_TEMPLATES.MORNING_RESIDENTIAL,
                        id: this.generateRouteId(),
                        technicianId: this.generateTechnicianId(),
                        technicianName: "John Smith",
                        date: new Date(),
                        tickets: Array.from({ length: 8 }, () => this.generateTicketId()),
                        optimized: false // Will be optimized during test
                    },
                    tickets: Array.from({ length: 8 }, (_, i) => ({
                        id: this.generateTicketId(),
                        ...this.TICKET_TEMPLATES.BASIC_PEST_CONTROL,
                        title: `Route Stop ${i + 1}`,
                        customerId: this.generateCustomerId(),
                        scheduledDate: new Date(),
                        estimatedDuration: 45 + Math.floor(Math.random() * 30) // 45-75 minutes
                    }))
                };
                
            case 'mobile_offline_sync':
                return {
                    offlineActions: [
                        {
                            type: 'ticket_update',
                            ticketId: this.generateTicketId(),
                            changes: { status: 'completed', completedAt: new Date() },
                            timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
                        },
                        {
                            type: 'customer_note',
                            customerId: this.generateCustomerId(),
                            note: 'Customer was not home, left notice',
                            timestamp: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
                        },
                        {
                            type: 'photo_upload',
                            ticketId: this.generateTicketId(),
                            photoPath: '/mobile/photos/damage_evidence.jpg',
                            timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
                        }
                    ],
                    syncRequired: true,
                    lastSyncTime: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
                };
                
            case 'customer_service_workflow':
                return {
                    customer: {
                        ...this.CUSTOMER_TEMPLATES.COMMERCIAL_RESTAURANT,
                        id: this.generateCustomerId(),
                        serviceHistory: [
                            {
                                id: 'HIST-001',
                                date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                                serviceType: 'Commercial Pest Control',
                                technician: 'John Smith',
                                status: 'completed' as const,
                                cost: 150
                            }
                        ]
                    },
                    newTicket: {
                        ...this.TICKET_TEMPLATES.COMMERCIAL_SERVICE,
                        id: this.generateTicketId(),
                        customerId: this.generateCustomerId(),
                        createdBy: this.generateTechnicianId(),
                        recurring: true,
                        recurringFrequency: 'monthly' as const
                    }
                };
                
            default:
                return this.generateComprehensiveTestDataSet();
        }
    }
    
    /**
     * Generate test data for API load testing
     * @param requestCount - Number of concurrent requests to simulate
     * @returns Array of test data for load testing
     */
    static generateLoadTestData(requestCount: number) {
        return Array.from({ length: requestCount }, (_, i) => ({
            requestId: `LOAD-${Date.now()}-${i}`,
            ticket: {
                id: this.generateTicketId(),
                ...this.getRandomItem(Object.values(this.TICKET_TEMPLATES)),
                customerId: this.generateCustomerId(),
                createdBy: this.generateTechnicianId(),
                createdAt: new Date()
            },
            customer: {
                id: this.generateCustomerId(),
                ...this.getRandomItem(Object.values(this.CUSTOMER_TEMPLATES)),
                createdAt: new Date()
            },
            expectedResponseTime: Math.floor(Math.random() * 1000) + 200, // 200-1200ms
            priority: this.getRandomItem(['low', 'medium', 'high'])
        }));
    }
}