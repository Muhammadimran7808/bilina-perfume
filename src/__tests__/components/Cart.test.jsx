/**
 * Cart page component tests.
 * The AppContext is mocked so we can control state independently.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Cart from '@/app/cart/page'
import { AppContext } from '@/context/Appcontext'

// ── Module mocks ──────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn(), back: jest.fn() }),
  usePathname: jest.fn().mockReturnValue('/cart'),
}))

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((_auth, cb) => { cb(null); return jest.fn() }),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
}))
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  doc: jest.fn(),
  addDoc: jest.fn().mockResolvedValue({ id: 'order-123' }),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
}))
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() },
  ToastContainer: () => null,
}))

jest.mock('sweetalert2', () => ({
  default: {
    fire: jest.fn().mockResolvedValue({ isConfirmed: false }),
  },
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }) => <img src={src} alt={alt} />,
}))

// ── Fixtures ──────────────────────────────────────────────────
const item1 = { id: 'p1', name: 'Rose Perfume',  price: 1000, quantity: 1, image: '/rose.jpg', volume: '50ml' }
const item2 = { id: 'p2', name: 'Oud Classic',   price: 1500, quantity: 2, image: '/oud.jpg',  volume: '100ml' }
const loggedInUser = { uid: 'u1', email: 'buyer@test.com' }

const baseCtx = {
  cart: [item1],
  removeFromCart: jest.fn(),
  updateCartQuantity: jest.fn(),
}

const renderCart = (ctxOverrides = {}) =>
  render(
    <AppContext.Provider value={{ ...baseCtx, ...ctxOverrides }}>
      <Cart />
    </AppContext.Provider>
  )

// ── Empty state ───────────────────────────────────────────────

describe('Cart – empty state', () => {
  test('shows empty-cart heading when cart is empty', () => {
    renderCart({ cart: [] })
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
  })

  test('shows Shop Now link when cart is empty', () => {
    renderCart({ cart: [] })
    expect(screen.getByRole('link', { name: /shop now/i })).toBeInTheDocument()
  })

  test('does not render the item list when cart is empty', () => {
    renderCart({ cart: [] })
    expect(screen.queryByText('Rose Perfume')).not.toBeInTheDocument()
  })
})

// ── Item rendering ────────────────────────────────────────────

describe('Cart – item list', () => {
  test('renders item name', () => {
    renderCart()
    expect(screen.getByText('Rose Perfume')).toBeInTheDocument()
  })

  test('renders item volume', () => {
    renderCart()
    expect(screen.getByText('Volume: 50ml')).toBeInTheDocument()
  })

  test('renders Shopping Cart heading', () => {
    renderCart()
    expect(screen.getByRole('heading', { name: /shopping cart/i })).toBeInTheDocument()
  })

  test('shows correct item count in header', () => {
    renderCart()
    expect(screen.getByText(/1 item/)).toBeInTheDocument()
  })

  test('shows plural "items" for multiple entries', () => {
    renderCart({ cart: [item1, item2] })
    expect(screen.getByText(/2 items/)).toBeInTheDocument()
  })

  test('calls removeFromCart with correct id when trash clicked', () => {
    const removeFromCart = jest.fn()
    renderCart({ removeFromCart })
    fireEvent.click(screen.getByLabelText('Remove item'))
    expect(removeFromCart).toHaveBeenCalledWith('p1')
  })

  test('calls updateCartQuantity +1 when plus button clicked', () => {
    const updateCartQuantity = jest.fn()
    renderCart({ updateCartQuantity })
    // Plus button is the last quantity-control button
    const buttons = screen.getAllByRole('button')
    const plusBtn = buttons.find(b => b.querySelector('.lucide-plus') || b.innerHTML.includes('Plus'))
    // Find by sibling structure: quantity span is between minus and plus
    const quantitySpan = screen.getByText('1') // quantity display
    const row = quantitySpan.parentElement
    const [, plusButton] = row.querySelectorAll('button')
    fireEvent.click(plusButton)
    expect(updateCartQuantity).toHaveBeenCalledWith('p1', 2)
  })

  test('calls updateCartQuantity -1 when minus button clicked', () => {
    const updateCartQuantity = jest.fn()
    renderCart({ cart: [{ ...item1, quantity: 2 }], updateCartQuantity })
    const quantitySpan = screen.getByText('2')
    const row = quantitySpan.parentElement
    const [minusButton] = row.querySelectorAll('button')
    fireEvent.click(minusButton)
    expect(updateCartQuantity).toHaveBeenCalledWith('p1', 1)
  })
})


// ── Order summary ─────────────────────────────────────────────

describe('Cart – order summary', () => {
  test('shows subtotal heading', () => {
    renderCart()
    expect(screen.getByText('Subtotal')).toBeInTheDocument()
  })

  test('shows total heading', () => {
    renderCart()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  test('shows shipping section', () => {
    renderCart()
    expect(screen.getByText('Shipping')).toBeInTheDocument()
  })

})



// ── Checkout handoff ──────────────────────────────────────────
// The cart reviews the basket and hands off. Delivery details and order
// placement belong to /checkout, which used to be a near-duplicate of this
// page that had drifted apart from it.

describe('Cart – checkout handoff', () => {
  test('links to the checkout page', () => {
    renderCart()
    const link = screen.getByRole('link', { name: /proceed to checkout/i })
    expect(link).toHaveAttribute('href', '/checkout')
  })

  test('states that payment is cash on delivery', () => {
    renderCart()
    expect(screen.getByText(/cash on delivery/i)).toBeInTheDocument()
  })

  test('does not collect delivery details', () => {
    renderCart()
    expect(screen.queryByPlaceholderText(/street address/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /place order/i })).not.toBeInTheDocument()
  })

  test('does not offer a coupon box', () => {
    renderCart()
    expect(screen.queryByPlaceholderText(/coupon/i)).not.toBeInTheDocument()
  })

  test('hides the checkout link when the cart is empty', () => {
    renderCart({ cart: [] })
    expect(screen.queryByRole('link', { name: /proceed to checkout/i })).not.toBeInTheDocument()
  })
})
