;; Decentralized Patent Office

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-already-exists (err u102))
(define-constant err-unauthorized (err u103))
(define-constant err-expired (err u104))
(define-constant err-invalid-status (err u105))
(define-constant err-too-many-reviews (err u106))
(define-constant err-transfer-failed (err u107))

;; Data variables
(define-data-var next-patent-id uint u1)
(define-data-var review-period uint u50400) ;; 5 days in blocks (assuming 10-minute block time)
(define-data-var patent-duration uint u5256000) ;; 20 years in blocks

;; Data maps
(define-map patents
  { patent-id: uint }
  {
    inventor: principal,
    title: (string-utf8 256),
    description: (string-ascii 4096),
    status: (string-ascii 20),
    timestamp: uint,
    expiration: uint,
    reviews: (list 10 principal)
  }
)

(define-map patent-licenses
  { patent-id: uint, licensee: principal }
  { active: bool, price: uint }
)

;; Public functions
(define-public (submit-patent (title (string-utf8 256)) (description (string-ascii 4096)))
  (let
    (
      (patent-id (var-get next-patent-id))
      (current-block block-height)
    )
    (map-set patents
      { patent-id: patent-id }
      {
        inventor: tx-sender,
        title: title,
        description: description,
        status: "pending",
        timestamp: current-block,
        expiration: (+ current-block (var-get patent-duration)),
        reviews: (list)
      }
    )
    (var-set next-patent-id (+ patent-id u1))
    (ok patent-id)
  )
)

(define-public (review-patent (patent-id uint) (approve bool))
  (let
    (
      (patent (unwrap! (map-get? patents { patent-id: patent-id }) (err err-not-found)))
      (current-status (get status patent))
      (reviews (get reviews patent))
    )
    (asserts! (is-eq current-status "pending") (err err-invalid-status))
    (asserts! (< (len reviews) u3) (err err-unauthorized))
    (asserts! (is-none (index-of reviews tx-sender)) (err err-unauthorized))
    (let
      (
        (updated-reviews (unwrap! (as-max-len? (append reviews tx-sender) u10) (err err-too-many-reviews)))
        (new-status (if (and approve (is-eq (len updated-reviews) u3)) "approved" current-status))
      )
      (map-set patents
        { patent-id: patent-id }
        (merge patent
          {
            status: new-status,
            reviews: updated-reviews
          }
        )
      )
      (ok true)
    )
  )
)

(define-public (renew-patent (patent-id uint))
  (let
    (
      (patent (unwrap! (map-get? patents { patent-id: patent-id }) (err err-not-found)))
      (current-block block-height)
    )
    (asserts! (is-eq (get inventor patent) tx-sender) (err err-unauthorized))
    (asserts! (< current-block (get expiration patent)) (err err-expired))
    (map-set patents
      { patent-id: patent-id }
      (merge patent { expiration: (+ current-block (var-get patent-duration)) })
    )
    (ok true)
  )
)

(define-public (offer-license (patent-id uint) (price uint))
  (let
    (
      (patent (unwrap! (map-get? patents { patent-id: patent-id }) (err err-not-found)))
    )
    (asserts! (is-eq (get inventor patent) tx-sender) (err err-unauthorized))
    (asserts! (is-eq (get status patent) "approved") (err err-invalid-status))
    (map-set patent-licenses
      { patent-id: patent-id, licensee: tx-sender }
      { active: true, price: price }
    )
    (ok true)
  )
)

(define-public (purchase-license (patent-id uint) (seller principal))
  (let
    (
      (license (unwrap! (map-get? patent-licenses { patent-id: patent-id, licensee: seller }) (err err-not-found)))
      (price (get price license))
    )
    (asserts! (get active license) (err err-unauthorized))
    (match (stx-transfer? price tx-sender seller)
      success (begin
        (map-set patent-licenses
          { patent-id: patent-id, licensee: tx-sender }
          { active: true, price: u0 }
        )
        (ok true)
      )
      error (err err-transfer-failed)
    )
  )
)

;; Read-only functions
(define-read-only (get-patent (patent-id uint))
  (map-get? patents { patent-id: patent-id })
)

(define-read-only (get-license (patent-id uint) (licensee principal))
  (map-get? patent-licenses { patent-id: patent-id, licensee: licensee })
)

;; Admin functions
(define-public (set-review-period (new-period uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
    (ok (var-set review-period new-period))
  )
)

(define-public (set-patent-duration (new-duration uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
    (ok (var-set patent-duration new-duration))
  )
)

