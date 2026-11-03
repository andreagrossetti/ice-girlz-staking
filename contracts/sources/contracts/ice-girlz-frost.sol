// SPDX-License-Identifier: MIT
// Made by 3xBuilds (https://www.3xbuilds.com)
// Reach out on Discord at Needle#5483 or on X(Twitter) at risavdeb03

pragma solidity ^0.8.22;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Frost is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ERC20Permit {
    constructor()
        ERC20("Frost", "FROST")
        Ownable(msg.sender)
        ERC20Permit("Frost")
    {}

    mapping(address => bool) public allowedMinters;

    function addMinter(address newMinter) public onlyOwner{
        allowedMinters[newMinter] = true;
    }

    function removeMinter(address minter) public onlyOwner{
        allowedMinters[minter] = false;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) public {
        require(allowedMinters[msg.sender] == true, "Not allowed to mint.");
        _mint(to, amount);
    }

    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
