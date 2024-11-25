import { describe, it, expect, beforeEach } from 'vitest';

// Mock contract state
let patents: any[] = [];
let patentLicenses: any[] = [];
let nextPatentId = 1;
const contractOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const blockHeight = 100;

// Mock contract functions
function submitPatent(inventor: string, title: string, description: string) {
  const patentId = nextPatentId++;
  patents.push({
    id: patentId,
    inventor,
    title,
    description,
    status: 'pending',
    timestamp: blockHeight,
    expiration: blockHeight + 5256000, // 20 years in blocks
    reviews: []
  });
  return { success: true, value: patentId };
}

function reviewPatent(reviewer: string, patentId: number, approve: boolean) {
  const patent = patents.find(p => p.id === patentId);
  if (!patent || patent.status !== 'pending' || patent.reviews.length >= 3 || patent.reviews.includes(reviewer)) {
    return { success: false, error: 'Invalid review' };
  }
  patent.reviews.push(reviewer);
  if (approve && patent.reviews.length === 3) {
    patent.status = 'approved';
  }
  return { success: true };
}

function renewPatent(inventor: string, patentId: number) {
  const patent = patents.find(p => p.id === patentId);
  if (!patent || patent.inventor !== inventor || blockHeight >= patent.expiration) {
    return { success: false, error: 'Cannot renew patent' };
  }
  patent.expiration = blockHeight + 5256000;
  return { success: true };
}

function offerLicense(inventor: string, patentId: number, price: number) {
  const patent = patents.find(p => p.id === patentId);
  if (!patent || patent.inventor !== inventor || patent.status !== 'approved') {
    return { success: false, error: 'Cannot offer license' };
  }
  patentLicenses.push({ patentId, licensee: inventor, active: true, price });
  return { success: true };
}

function purchaseLicense(buyer: string, patentId: number, seller: string) {
  const license = patentLicenses.find(l => l.patentId === patentId && l.licensee === seller);
  if (!license || !license.active) {
    return { success: false, error: 'License not available' };
  }
  license.licensee = buyer;
  license.price = 0;
  return { success: true };
}

// Tests
describe('Decentralized Patent Office', () => {
  beforeEach(() => {
    patents = [];
    patentLicenses = [];
    nextPatentId = 1;
  });
  
  it('allows submitting and reviewing patents', () => {
    const submitResult = submitPatent('inventor1', 'New Invention', 'A groundbreaking device');
    expect(submitResult.success).toBe(true);
    expect(submitResult.value).toBe(1);
    
    const reviewResult1 = reviewPatent('reviewer1', 1, true);
    expect(reviewResult1.success).toBe(true);
    
    const reviewResult2 = reviewPatent('reviewer2', 1, true);
    expect(reviewResult2.success).toBe(true);
    
    const reviewResult3 = reviewPatent('reviewer3', 1, true);
    expect(reviewResult3.success).toBe(true);
    
    const patent = patents.find(p => p.id === 1);
    expect(patent.status).toBe('approved');
    expect(patent.reviews.length).toBe(3);
  });
  
  it('prevents duplicate reviews', () => {
    submitPatent('inventor1', 'New Invention', 'A groundbreaking device');
    reviewPatent('reviewer1', 1, true);
    const duplicateReview = reviewPatent('reviewer1', 1, true);
    expect(duplicateReview.success).toBe(false);
  });
  
  it('allows renewing patents', () => {
    submitPatent('inventor1', 'New Invention', 'A groundbreaking device');
    const renewResult = renewPatent('inventor1', 1);
    expect(renewResult.success).toBe(true);
    
    const patent = patents.find(p => p.id === 1);
    expect(patent.expiration).toBe(blockHeight + 5256000);
  });
  
  it('allows offering and purchasing licenses', () => {
    submitPatent('inventor1', 'New Invention', 'A groundbreaking device');
    reviewPatent('reviewer1', 1, true);
    reviewPatent('reviewer2', 1, true);
    reviewPatent('reviewer3', 1, true);
    
    const offerResult = offerLicense('inventor1', 1, 1000000);
    expect(offerResult.success).toBe(true);
    
    const purchaseResult = purchaseLicense('buyer1', 1, 'inventor1');
    expect(purchaseResult.success).toBe(true);
    
    const license = patentLicenses.find(l => l.patentId === 1 && l.licensee === 'buyer1');
    expect(license).toBeTruthy();
    expect(license.price).toBe(0);
  });
  
  it('prevents unauthorized actions', () => {
    submitPatent('inventor1', 'New Invention', 'A groundbreaking device');
    
    const unauthorizedRenew = renewPatent('inventor2', 1);
    expect(unauthorizedRenew.success).toBe(false);
    
    const unauthorizedOffer = offerLicense('inventor2', 1, 1000000);
    expect(unauthorizedOffer.success).toBe(false);
  });
});

