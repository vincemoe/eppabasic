﻿
/**
 * Integers are saved in little endian array.
 * Each item in the array are saved as 32 bit unsigned integers.
 * Each 
 * 
 * Integers are saved in the following form:
 * +--------+------+----------+
 * | region | size | data ... |
 * +--------+------+----------+
 * | offset |    0 |        4 |
 * +--------+------+----------+
 * 
 * The size is a 32 bit unsigned integer
 */

/**
 * Normalizes an integer in-place
 */
function intnorm(A) {
    A = A | 0;
    var Al = 0;
    Al = HEAP32U[A >> 2] | 0;
    if (!(Al | 0))
        return;         // Nothing to normalize
    // Remove zeroes
    while (
            ((Al | 0) > 4) &                                        // Must be something left to remove
            (((HEAP32U[(A + Al) >> 2] | 0) == 0)) &                 // Must be zero
            ((HEAP32U[(A + Al - 4) >> 2] & 0x80000000) == 0)        // And must not be significant (the uppormost bit must not be 1)
        )
        Al = Al - 4 | 0;

    if (
            ((Al | 0) == 4) &                                       // Only one limb left
            ((HEAP32U[(A + Al) >> 2] == 0))                         // And it is zero
        )
        Al = Al - 4 | 0;                                            // Remove it!

    // Remove 0xffffffff
    while (
            ((Al | 0) > 4) &                                        // Must be something left to remove
            (((HEAP32U[(A + Al) >> 2] | 0) == (0xffffffff | 0))) &  // Must be 0xffffffff
            ((HEAP32U[(A + Al - 4) >> 2] & 0x80000000) != 0)        // And must not be significant (the uppormost bit must be 1)
        )
        Al = Al - 4 | 0;

    // Finally save Al
    HEAP32U[A >> 2] = Al | 0;
}

/**
 * Performs an addition
 */
function intadd(A, B) {
    // Locations of numbers
    A = A | 0;
    B = B | 0;
    var R = 0;
    // Length of numbers
    var Al = 0;
    var Bl = 0;
    var Rl = 0;

    var t = 0;      // Temporary
    var i = 0;      // Index
    var c = 0;      // Carry
    var a = 0;      // A piece of A
    var b = 0;      // A piece of B
    var r = 0;      // A piece of R

    // Read the lenghts of the numbers
    Al = HEAP32U[A >> 2];
    Bl = HEAP32U[B >> 2];

    // Make sure A is longer
    if ((Al | 0) < (Bl | 0)) {
        t = A, A = B, B = t;
        t = Al, Al = Bl, Bl = t;
    }

    // Reserve memory for R
    Rl = Al + 4 | 0;
    R = alloc(Rl + 4 | 0) | 0;

    // Move pointers to point to the start of the data
    A = A + 4 | 0;
    B = B + 4 | 0;
    R = R + 4 | 0;

    // Perform the addition
    for (; (i | 0) < (Bl | 0) ; i = i + 4 | 0) {
        // Load
        a = HEAP32U[(A + i) >> 2] | 0;
        b = HEAP32U[(B + i) >> 2] | 0;
        // Lower bits
        t = ((a & 0xffff) + (b & 0xffff) + c) | 0;
        // Upper bits
        r = (a >>> 16) + (b >>> 16) + (t >>> 16) | 0;
        // Save
        HEAP32U[(R + i) >> 2] = (t & 0xffff) | (r << 16);
        // Carry
        c = r >>> 16;
    }
    for (; (i | 0) < (Al | 0) ; i = i + 4 | 0) {
        // Load
        a = HEAP32U[(A + i) >> 2] | 0;
        // Lower bits
        t = ((a & 0xffff) + c) | 0;
        // Upper bits
        r = (a >>> 16) + (t >>> 16) | 0;
        // Save
        HEAP32U[(R + i) >> 2] = (t & 0xffff) | (r << 16);
        // Carry
        c = r >>> 16;
    }
    // Add resulting carry or adjust Rl
    if (c | 0)
        HEAP32U[(R + i) >> 2] = c | 0;
    else
        Rl = Rl - 4 | 0;
    // Move result to point back to the right place
    R = R - 4 | 0;
    // Save the R length
    HEAP32U[R >> 2] = Rl;
    // Normalize it
    intnorm(R | 0);
    // And return it
    return R | 0;
}

/**
 * Performs a substraction
 */
function intsub(A, B) {
    // Locations of numbers
    A = A | 0;
    B = B | 0;
    var R = 0;
    // Length of numbers
    var Al = 0;
    var Bl = 0;
    var Rl = 0;

    var t = 0;      // Temporary
    var i = 0;      // Index
    var c = 0;      // Carry
    var a = 0;      // A piece of A
    var b = 0;      // A piece of B
    var r = 0;      // A piece of R

    // Read the lenghts of the numbers
    Al = HEAP32U[A >> 2];
    Bl = HEAP32U[B >> 2];

    // Reserve memory for the R
    Rl = (Al | 0) > (Bl | 0) ? Al + 4 | 0 : Bl + 4 | 0;
    R = alloc(Rl + 4 | 0) | 0;

    // Move pointers to point to the start of the data
    A = A + 4 | 0;
    B = B + 4 | 0;
    R = R + 4 | 0;

    if ((Al | 0) < (Bl | 0)) {
        for (; (i | 0) < (Al | 0) ; i = i + 4 | 0) {
            // Load
            a = HEAP32U[(A + i) >> 2] | 0;
            b = HEAP32U[(B + i) >> 2] | 0;
            // Lower bits
            t = ((a & 0xffff) - (b & 0xffff) + c) | 0;
            // Upper bits
            r = ((a >>> 16) - (b >>> 16) | 0) + (t >> 16) | 0;
            // Save
            HEAP32U[(R + i) >> 2] = (t & 0xffff) | (r << 16);
            // Carry
            c = r >> 16;
        }
        for (; (i | 0) < (Bl | 0) ; i = i + 4 | 0) {
            // Load
            b = HEAP32U[(B + i) >> 2] | 0;
            // Lower bits
            t = (c - (b & 0xffff)) | 0;
            // Upper bits
            r = (t >> 16) - (b >>> 16) | 0;
            // Save
            HEAP32U[(R + i) >> 2] = (t & 0xffff) | (r << 16);
            // Carry
            c = r >> 16;
        }
        if (HEAP32U[(B + Bl - 4) >> 2] & 0x80000000) {
            for (; (i | 0) < (Rl | 0) ; i = i + 4 | 0) {
                // Load
                b = 0xffffffff;
                // Lower bits
                t = (c - (b & 0xffff)) | 0;
                // Upper bits
                r = (t >> 16) - (b >>> 16) | 0;
                // Save
                HEAP32U[(R + i) >> 2] = (t & 0xffff) | (r << 16);
                // Carry
                c = r >> 16;
            }
        } else {
            for (; (i | 0) < (Rl | 0) ; i = i + 4 | 0) {
                // Load
                b = 0;
                // Lower bits
                t = (c - (b & 0xffff)) | 0;
                // Upper bits
                r = (t >> 16) - (b >>> 16) | 0;
                // Save
                HEAP32U[(R + i) >> 2] = (t & 0xffff) | (r << 16);
                // Carry
                c = r >> 16;
            }
        }
    } else {
        for (; (i | 0) < (Bl | 0) ; i = i + 4 | 0) {
            // Load
            a = HEAP32U[(A + i) >> 2] | 0;
            b = HEAP32U[(B + i) >> 2] | 0;
            // Lower bits
            t = ((a & 0xffff) - (b & 0xffff) + c) | 0;
            // Upper bits
            r = (a >>> 16) - (b >>> 16) + (t >> 16) | 0;
            // Save
            HEAP32U[(R + i) >> 2] = (t & 0xffff) | (r << 16);
            // Carry
            c = r >> 16;
        }
        for (; (i | 0) < (Al | 0) ; i = i + 4 | 0) {
            // Load
            a = HEAP32U[(A + i) >> 2] | 0;
            // Lower bits
            t = ((a & 0xffff) + c) | 0;
            // Upper bits
            r = (a >>> 16) + (t >> 16) | 0;
            // Save
            HEAP32U[(R + i) >> 2] = (t & 0xffff) | (r << 16);
            // Carry
            c = r >> 16;
        }

        if (HEAP32U[(A + Al - 4) >> 2] & 0x80000000) {
            // A is negative
            for (; (i | 0) < (Rl | 0) ; i = i + 4 | 0) {
                a = 0xffffffff;
                // Lower bits
                t = ((a & 0xffff) + c) | 0;
                // Upper bits
                r = (a >>> 16) + (t >> 16) | 0;
                // Save
                HEAP32U[(R + i) >> 2] = (t & 0xffff) | (r << 16);
                // Carry
                c = r >> 16;
            }
        } else {
            // A is positive
            for (; (i | 0) < (Rl | 0) ; i = i + 4 | 0) {
                a = 0;
                // Lower bits
                t = ((a & 0xffff) + c) | 0;
                // Upper bits
                r = (a >>> 16) + (t >> 16) | 0;
                // Save
                HEAP32U[(R + i) >> 2] = (t & 0xffff) | (r << 16);
                // Carry
                c = r >> 16;
            }
        }
    }

    // Move result to point back to the right place
    R = R - 4 | 0;
    // Save the R length
    HEAP32U[R >> 2] = Rl;
    // Normalize it
    intnorm(R | 0);
    // And return it
    return R | 0;
}

/**
 * Parforms a simple and slow multiplication.
 */
function intmul(A, B) {
    // Locations of numbers
    A = A | 0;
    B = B | 0;
    var R = 0;
    // Length of numbers
    var Al = 0;
    var Bl = 0;
    var Rl = 0;
    // Info about negativity
    var An = 0;
    var Bn = 0;
    var c = 0;      // Carry
    var i = 0;      // Index 1
    var j = 0;      // Index 2
    var a = 0;      // A piece of A
    var b = 0;      // A piece of B
    var rh = 0      // A piece of R
    var t = 0;      // Temporary

    // Read the lenghts of the numbers
    Al = HEAP32U[A >> 2];
    Bl = HEAP32U[B >> 2];

    // Find if numbers are negative
    An = ((Al | 0) > 0) ? (HEAP32U[(A + Al) >> 2] & 0x80000000) != 0 : 0;
    Bn = ((Bl | 0) > 0) ? (HEAP32U[(B + Bl) >> 2] & 0x80000000) != 0 : 0;

    // Reserve size for the result
    Rl = Al + Bl | 0;
    R = alloc(Rl + 4 | 0) | 0;

    // Move pointers to point to the start of the data
    A = A + 4 | 0;
    B = B + 4 | 0;
    R = R + 4 | 0;

    for (; (i | 0) < (Bl << 1) ; i = i + 2 | 0) {
        c = 0;
        b = (i | 0) < (Bl | 0) ? HEAP32U[(B + i) >> 2] : (Bn ? 0xffffffff : 0);
        if ((i & 2) == 0)
            b = b & 0xffff;
        else
            b = b >>> 16;

        for (j = 0; (j | 0) < (Al << 1) ; j = j + 2 | 0) {
            if ((i + j | 0) >= (Rl | 0)) continue;
            a = (j | 0) < (Al | 0) ? HEAP32U[(A + j) >> 2] : (An ? 0xffffffff : 0);

            if ((j & 2) == 0)
                a = a & 0xffff;
            else
                a = a >>> 16;

            r = (imul(a | 0, b | 0) | 0) + c | 0;

            HEAP16U[(R + i + j) >> 1] += r & 0xffff;
            c = r >>> 16;
        }
    }

    // Restore R
    R = R - 4 | 0;
    // Save the R length
    HEAP32U[R >> 2] = Rl;
    // Normalize it
    intnorm(R | 0);
    // And return it
    return R;
}

/**
 * Performs a simple division using binary search
 */
function intdiv(A, B) {
    // Locations of numbers
    A = A | 0;
    B = B | 0;
    var Hi = 0;
    var Mi = 0;
    var Lo = 0;
    // Length of numbers
    var Al = 0;
    var Bl = 0;
    var Hil = 0;
    var Lol = 0;
    // Variables
    var i = 0;
    var tmp = 0;
    var c = 0;
    var c2 = 0;
    var sign = 0;
    var Afree = 0;
    var Bfree = 0;

    if (intsign(A) < 0) {
        A = intneg(A | 0) | 0;
        sign = ~sign;
        Afree = 1;
    }
    if (intsign(B) < 0) {
        B = intneg(B | 0) | 0;
        sign = ~sign;
        Bfree = 1;
    }

    // Read the lenghts of the numbers
    Al = HEAP32U[A >> 2];
    Bl = HEAP32U[B >> 2];

    // Low is 0 for the begining
    Lol = 0;
    Lo = alloc((Lol + 4) | 0) | 0;
    HEAP32U[Lo >> 2] = Lol;
    // High is A for the begining
    Hil = Al;
    Hi = alloc((Hil + 4) | 0) | 0;
    HEAP32U[Hi >> 2] = Hil;
    for (; (i | 0) < (Hil | 0) ; i = (i + 4) | 0) {
        HEAP32U[(Hi + 4 + i) >> 2] = HEAP32U[(A + 4 + i) >> 2];
    }

    while ((intcmp(Lo | 0, Hi | 0) | 0) < 0) {
        // Mi = Lo + Hi
        Mi = intadd(Lo | 0, Hi | 0) | 0;
        // tmp = Lo + Hi + 1
        tmp = intinc(Mi | 0) | 0;
        //free(Mi | 0);                 // Use the reserved area to store tmp/2
        // Mi = (Lo + Hi + 1)/2
        c = 0;
        // Shift right by 1 to get /2
        for (i = HEAP32U[Mi >> 2] | 0; (i | 0) > 0; i = (i - 4) | 0) {
            c2 = HEAP32U[(tmp + i) >> 2] | 0;
            HEAP32U[(Mi + i) >> 2] = (c << 31) | (c2 >>> 1);
            c = c2 & 1;
        }
        intnorm(Mi);
        // Free excess memory
        free(tmp | 0);

        // tmp = B * Mi
        tmp = intmul(B | 0, Mi | 0) | 0;
        // If A > B * Mi
        if ((intcmp(A | 0, tmp | 0) | 0) > 0) {
            free(tmp | 0);
            // Hi = Mi - 1
            free(Hi | 0);
            Hi = intdec(Mi | 0) | 0;
        } else {
            free(tmp | 0);
            // Lo = Mi
            free(Lo);
            Lo = Mi | 0;
        }

        // Free excess memory
        free(Mi | 0);
    }

    // The result is in Lo
    // Free everythin else
    free(Hi | 0);
    if (Afree)
        free(A | 0);
    if (Bfree)
        free(B | 0);
    if (sign) {
        tmp = intneg(Lo);
        free(Lo | 0);
        Lo = tmp | 0;
    }

    return Lo | 0;
}

/**
 * Increases the number by one
 */
function intinc(A) {
    // Locations of numbers
    A = A | 0;
    var R = 0;
    // Length of numbers
    var Al = 0;
    var Rl = 0;

    var t = 0;      // Temporary
    var i = 0;      // Index
    var c = 0;      // Carry
    var a = 0;      // A piece of A
    var r = 0;      // A piece of R

    // Read the lenghts of the numbers
    Al = HEAP32U[A >> 2];

    // Reserve memory for R
    Rl = Al + 4 | 0;
    R = alloc(Rl + 4 | 0) | 0;

    // Move pointers to point to the start of the data
    A = A + 4 | 0;
    R = R + 4 | 0;

    // What to add
    c = 1;

    for (; (i | 0) < (Al | 0) ; i = i + 4 | 0) {
        // Load
        a = HEAP32U[(A + i) >> 2] | 0;
        // Lower bits
        t = ((a & 0xffff) + c) | 0;
        // Upper bits
        r = (a >>> 16) + (t >>> 16) | 0;
        // Save
        HEAP32U[(R + i) >> 2] = (t & 0xffff) | (r << 16);
        // Carry
        c = r >>> 16;
    }
    // Negative numbers are only getting shorter while positives can grow
    if (
        ((Al | 0) == 0) |
        (
            ((Al | 0) > 0) &
            ((HEAP32U[(A + Al - 4) >> 2] & 0x80000000) == 0)
        )
        )
        HEAP32U[(R + i) >> 2] = c | 0;
    else
        Rl = Rl - 4 | 0;
    // Move result to point back to the right place
    R = R - 4 | 0;
    // Save the R length
    HEAP32U[R >> 2] = Rl;
    // Normalize it
    intnorm(R | 0);
    // And return it
    return R | 0;
}

/**
 * Decreases the number by one
 */
function intdec(A) {
    // Locations of numbers
    A = A | 0;
    var R = 0;
    // Length of numbers
    var Al = 0;
    var Rl = 0;

    var t = 0;      // Temporary
    var i = 0;      // Index
    var c = 0;      // Carry
    var a = 0;      // A piece of A
    var r = 0;      // A piece of R

    // Read the lenghts of the numbers
    Al = HEAP32U[A >> 2];

    // Reserve memory for the R
    Rl = Al + 4 | 0;
    R = alloc(Rl + 4 | 0) | 0;

    // Move pointers to point to the start of the data
    A = A + 4 | 0;
    R = R + 4 | 0;

    // What to substract
    c = 0xffffffff;

    for (; (i | 0) < (Al | 0) ; i = i + 4 | 0) {
        // Load
        a = HEAP32U[(A + i) >> 2] | 0;
        // Lower bits
        t = ((a & 0xffff) + c) | 0;
        // Upper bits
        r = (a >>> 16) + (t >> 16) | 0;
        // Save
        HEAP32U[(R + i) >> 2] = (t & 0xffff) | (r << 16);
        // Carry
        c = r >> 16;
    }

    if (HEAP32U[(A + Al - 4) >> 2] & 0x80000000) {
        // A is negative
        for (; (i | 0) < (Rl | 0) ; i = i + 4 | 0) {
            a = 0xffffffff;
            // Lower bits
            t = ((a & 0xffff) + c) | 0;
            // Upper bits
            r = (a >>> 16) + (t >> 16) | 0;
            // Save
            HEAP32U[(R + i) >> 2] = (t & 0xffff) | (r << 16);
            // Carry
            c = r >> 16;
        }
    } else {
        // A is positive
        for (; (i | 0) < (Rl | 0) ; i = i + 4 | 0) {
            a = 0;
            // Lower bits
            t = ((a & 0xffff) + c) | 0;
            // Upper bits
            r = (a >>> 16) + (t >> 16) | 0;
            // Save
            HEAP32U[(R + i) >> 2] = (t & 0xffff) | (r << 16);
            // Carry
            c = r >> 16;
        }
    }

    // Move result to point back to the right place
    R = R - 4 | 0;
    // Save the R length
    HEAP32U[R >> 2] = Rl;
    // Normalize it
    intnorm(R | 0);
    // And return it
    return R | 0;
}

/**
 * Returns the sign of the integer
 */
function intsign(A) {
    A = A | 0;
    // Length of numbers
    var Al = 0;

    // Read the lenghts of the numbers
    Al = HEAP32U[A >> 2];

    if ((Al | 0) == 0)
        return 0;           // Number is zero

    if (HEAP32U[(A + Al) >> 2] & 0x80000000)
        return -1;          // Negative
    return 1;               // Positive
}

/*
 * Compares two integers
 * Returns:
 *     1 if the first one is greater
 *     0 if the numbers are equal
 *    -1 if the second one is greater
 */
function intcmp(A, B) {
    A = A | 0;
    B = B | 0;
    var tmp = 0;
    var sign = 0;

    tmp = intsub(A, B);
    sign = intsign(tmp);
    free(tmp);
    return sign;
}

/*
 * Negates an integer
 */
function intneg(A) {
    A = A | 0;
    var ZERO = 0;
    var R = 0;
    ZERO = alloc(4) | 0;
    HEAP32U[ZERO >> 2] = 0;
    R = intsub(ZERO | 0, B | 0) | 0;
    free(ZERO);
    return R;
}